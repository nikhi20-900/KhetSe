import { Prisma, type PrismaClient } from "@prisma/client";

import type { ShipmentResponse } from "@/lib/contracts/shipment.contract";
import { getPrisma } from "@/lib/db/client";
import { withReservationTransaction } from "@/lib/db/transactions";
import {
  DEMO_DISPATCH_LOCATION,
  canTransitionShipment,
  isNormalShipmentStatus,
  type NormalShipmentStatus,
} from "@/lib/domain/state-machine";

export class ShipmentError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

const guarded = new WeakSet<PrismaClient>();

const SHIPMENT_EVENT_FUNCTION = `
CREATE OR REPLACE FUNCTION reject_shipment_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  RAISE EXCEPTION 'SHIPMENT_EVENT_IMMUTABLE: Shipment events cannot be updated or deleted.';
END;
$fn$
`;

async function ensureShipmentGuards(db: PrismaClient): Promise<void> {
  if (guarded.has(db)) return;
  await db.$executeRawUnsafe(SHIPMENT_EVENT_FUNCTION);
  await db.$executeRawUnsafe(
    "DROP TRIGGER IF EXISTS shipment_events_append_only ON shipment_events"
  );
  await db.$executeRawUnsafe(`
    CREATE TRIGGER shipment_events_append_only
    BEFORE UPDATE OR DELETE ON shipment_events
    FOR EACH ROW
    EXECUTE FUNCTION reject_shipment_event_mutation()
  `);
  guarded.add(db);
}

type Tx = Prisma.TransactionClient;

interface LockedReservation {
  id: string;
  status: string;
  allocatedKg: number;
  requestedPlanKey: string;
  planId: string | null;
  transportSlotId: string | null;
  expired: boolean;
}

async function lockReservation(tx: Tx, id: string): Promise<LockedReservation> {
  const rows = await tx.$queryRaw<LockedReservation[]>`
    SELECT id,
           status::text AS status,
           "allocatedKg",
           "requestedPlanKey",
           "planId",
           "transportSlotId",
           ("expiresAt" <= NOW()) AS expired
    FROM reservations
    WHERE id = ${id}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) {
    throw new ShipmentError(
      404,
      "RESERVATION_NOT_FOUND",
      `Reservation ${id} does not exist.`
    );
  }
  return row;
}

async function ensurePlan(
  tx: Tx,
  reservation: LockedReservation
): Promise<{ harvestId: string; planId: string; destination: string }> {
  if (reservation.planId) {
    const plan = await tx.logisticsPlan.findUnique({
      where: { id: reservation.planId },
    });
    if (plan) {
      return {
        harvestId: plan.harvestId,
        planId: plan.id,
        destination: plan.marketDestination,
      };
    }
  }
  const slot = reservation.transportSlotId
    ? await tx.transportSlot.findUnique({
        where: { id: reservation.transportSlotId },
      })
    : null;
  const harvest = await tx.harvest.create({
    data: {
      cropType: "Nashik Red Onion",
      quantityKg: reservation.allocatedKg,
      originLocation: DEMO_DISPATCH_LOCATION,
      harvestTimestamp: new Date(),
      qualityGrade: "Unspecified",
      handlingNotes:
        "Opened from a confirmed capacity reservation. Price and transit fields on the linked plan are unset because this hold did not include a priced plan.",
    },
  });
  const plan = await tx.logisticsPlan.create({
    data: {
      harvestId: harvest.id,
      marketDestination: "Not specified on the reservation",
      transportMode: slot?.vehicleType ?? "Not specified on the reservation",
      estimatedCostInr: 0,
      expectedGrossInr: 0,
      expectedNetInr: 0,
      transitDurationHr: 0,
      isFeasible: true,
      rejectionReason:
        "Financial fields are 0 because this plan row only links a capacity hold. They are not modeled proceeds.",
    },
  });
  return {
    harvestId: harvest.id,
    planId: plan.id,
    destination: plan.marketDestination,
  };
}

async function latestEventTime(
  tx: Tx,
  shipmentId: string
): Promise<Date | null> {
  const event = await tx.shipmentEvent.findFirst({
    where: { shipmentId },
    orderBy: [{ eventTime: "desc" }, { id: "desc" }],
  });
  return event?.eventTime ?? null;
}

async function readShipment(
  tx: Tx,
  shipmentId: string
): Promise<ShipmentResponse> {
  const shipment = await tx.shipment.findUnique({
    where: { id: shipmentId },
    include: { events: { orderBy: [{ eventTime: "asc" }, { id: "asc" }] } },
  });
  if (!shipment) {
    throw new ShipmentError(
      404,
      "SHIPMENT_NOT_FOUND",
      `Shipment ${shipmentId} does not exist.`
    );
  }
  return {
    shipmentId: shipment.id,
    status: shipment.status,
    currentLocation: shipment.currentLocation,
    milestoneEventsCount: shipment.events.length,
    reservationId: shipment.reservationId,
    dispatchedAt: shipment.dispatchedAt?.toISOString() ?? null,
    deliveredAt: shipment.deliveredAt?.toISOString() ?? null,
    events: shipment.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      location: event.locationTag,
      description: event.description,
      eventTime: event.eventTime.toISOString(),
    })),
  };
}

export async function createShipment(
  input: { reservationId: string; dispatchedAt?: Date },
  db: PrismaClient = getPrisma()
): Promise<ShipmentResponse> {
  await ensureShipmentGuards(db);
  return withReservationTransaction(async (tx) => {
    const reservation = await lockReservation(tx, input.reservationId);
    if (reservation.expired || reservation.status === "EXPIRED") {
      throw new ShipmentError(
        409,
        "RESERVATION_EXPIRED",
        "The reservation has expired, so it cannot start a shipment."
      );
    }
    if (reservation.status !== "CONFIRMED") {
      throw new ShipmentError(
        422,
        "RESERVATION_NOT_CONFIRMED",
        `Only a confirmed reservation can start a shipment. This one is ${reservation.status}.`
      );
    }
    const existing = await tx.shipment.findFirst({
      where: { reservationId: reservation.id },
    });
    if (existing) {
      throw new ShipmentError(
        409,
        "RESERVATION_ALREADY_SHIPPED",
        "This reservation already has a shipment."
      );
    }
    const bookedAt = new Date();
    if (
      input.dispatchedAt &&
      input.dispatchedAt.getTime() < bookedAt.getTime()
    ) {
      throw new ShipmentError(
        422,
        "EVENT_OUT_OF_ORDER",
        "Dispatch time cannot be earlier than the booking event."
      );
    }
    const plan = await ensurePlan(tx, reservation);
    await tx.$executeRaw`
      UPDATE reservations
      SET status = 'CONSUMED', "updatedAt" = NOW()
      WHERE id = ${reservation.id} AND status = 'CONFIRMED'
    `;
    const shipment = await tx.shipment.create({
      data: {
        harvestId: plan.harvestId,
        planId: plan.planId,
        reservationId: reservation.id,
        status: "BOOKED",
        currentLocation: DEMO_DISPATCH_LOCATION,
        events: {
          create: {
            eventType: "BOOKED",
            locationTag: DEMO_DISPATCH_LOCATION,
            description:
              "Shipment booked against a confirmed capacity reservation. Completion does not claim a sale price.",
            eventTime: bookedAt,
          },
        },
      },
    });
    if (!input.dispatchedAt) return readShipment(tx, shipment.id);
    await appendTransition(tx, shipment.id, {
      status: "DISPATCHED",
      occurredAt: input.dispatchedAt,
      location: DEMO_DISPATCH_LOCATION,
    });
    return readShipment(tx, shipment.id);
  }, db);
}

async function appendTransition(
  tx: Tx,
  shipmentId: string,
  input: { status: NormalShipmentStatus; occurredAt: Date; location?: string }
): Promise<void> {
  const shipment = await tx.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) {
    throw new ShipmentError(
      404,
      "SHIPMENT_NOT_FOUND",
      `Shipment ${shipmentId} does not exist.`
    );
  }
  if (!isNormalShipmentStatus(shipment.status)) {
    throw new ShipmentError(
      422,
      "INVALID_SHIPMENT_TRANSITION",
      `Status ${shipment.status} is outside the normal delivery path.`
    );
  }
  if (!canTransitionShipment(shipment.status, input.status)) {
    throw new ShipmentError(
      422,
      "INVALID_SHIPMENT_TRANSITION",
      `${shipment.status} cannot transition to ${input.status}.`
    );
  }
  const previous = await latestEventTime(tx, shipmentId);
  if (previous && input.occurredAt.getTime() < previous.getTime()) {
    throw new ShipmentError(
      422,
      "EVENT_OUT_OF_ORDER",
      "Shipment events must stay in chronological order."
    );
  }
  const location =
    input.location ??
    (input.status === "DISPATCHED"
      ? DEMO_DISPATCH_LOCATION
      : shipment.currentLocation);
  if (!location) {
    throw new ShipmentError(
      422,
      "LOCATION_REQUIRED",
      "A location is required for this shipment event."
    );
  }
  await tx.shipmentEvent.create({
    data: {
      shipmentId,
      eventType: input.status,
      locationTag: location,
      description: eventDescription(input.status, location),
      eventTime: input.occurredAt,
    },
  });
  await tx.shipment.update({
    where: { id: shipmentId },
    data: {
      status: input.status,
      currentLocation: location,
      dispatchedAt:
        input.status === "DISPATCHED"
          ? input.occurredAt
          : shipment.dispatchedAt,
      deliveredAt:
        input.status === "DELIVERED" ? input.occurredAt : shipment.deliveredAt,
    },
  });
}

function eventDescription(
  status: NormalShipmentStatus,
  location: string
): string {
  if (status === "DISPATCHED") {
    return `Dispatched from ${location}. This is a recorded milestone, not a live location.`;
  }
  if (status === "IN_TRANSIT") {
    return `In transit at ${location}. This checkpoint is recorded by the caller, not by GPS.`;
  }
  return `Delivered at ${location}. Delivery does not by itself verify a sale price.`;
}

export async function transitionShipment(
  shipmentId: string,
  input: { status: NormalShipmentStatus; occurredAt: Date; location?: string },
  db: PrismaClient = getPrisma()
): Promise<ShipmentResponse> {
  await ensureShipmentGuards(db);
  return withReservationTransaction(async (tx) => {
    await appendTransition(tx, shipmentId, input);
    return readShipment(tx, shipmentId);
  }, db);
}

export async function getShipment(
  shipmentId: string,
  db: PrismaClient = getPrisma()
): Promise<ShipmentResponse> {
  await ensureShipmentGuards(db);
  return withReservationTransaction((tx) => readShipment(tx, shipmentId), db);
}
