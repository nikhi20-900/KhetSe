import { createHash, randomUUID } from "crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

import type { ReservationResponse } from "@/lib/contracts/reservation.contract";
import {
  canTransition,
  slotsForKilograms,
  vehicleIdFromPlanKey,
  type ReservationStatus,
} from "@/lib/domain/booking";
import { getPrisma } from "@/lib/db/client";
import { RESERVATION_SQL } from "@/lib/db/queries/reservation-sql";
import { withReservationTransaction } from "@/lib/db/transactions";

const prepared = new WeakSet<PrismaClient>();

async function ensureReservationSql(db: PrismaClient): Promise<void> {
  if (prepared.has(db)) return;
  await db.$executeRawUnsafe(RESERVATION_SQL);
  prepared.add(db);
}

function reservationErrorFromDatabase(error: unknown): ReservationError | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(
    /(CAPACITY_EXCEEDED|TRANSPORT_SLOT_NOT_FOUND|STORAGE_FACILITY_NOT_FOUND|IDEMPOTENCY_CONFLICT): ([^\n]+)/
  );
  if (!match) return null;
  const code = match[1];
  const status = code.endsWith("NOT_FOUND") ? 404 : 409;
  return new ReservationError(status, code, match[2].trim());
}

export class ReservationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

interface LockedTransport {
  id: string;
  availableKg: number;
  capacityKg: number;
  vehicleType: string;
}

interface LockedStorage {
  id: string;
  freeSlots: number;
  totalSlots: number;
  kgPerSlot: number;
  name: string;
}

interface LockedReservation {
  id: string;
  status: ReservationStatus;
  allocatedKg: number;
  allocatedSlots: number | null;
  expiresAt: Date;
  transportSlotId: string | null;
  storageFacilityId: string | null;
  requestedPlanKey: string;
}

type Tx = Prisma.TransactionClient;

function hashRequest(operation: string, payload: unknown): string {
  return createHash("sha256")
    .update(`${operation}:${JSON.stringify(payload)}`)
    .digest("hex");
}

async function advisoryLock(tx: Tx, key: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

async function readIdempotent(
  tx: Tx,
  key: string,
  requestHash: string
): Promise<ReservationResponse | null> {
  const rows = await tx.$queryRaw<
    Array<{
      requestHash: string;
      responseStatus: number;
      responseJson: ReservationResponse;
    }>
  >`SELECT "requestHash", "responseStatus", "responseJson" FROM idempotency_records WHERE key = ${key} FOR UPDATE`;
  const row = rows[0];
  if (!row) return null;
  if (row.requestHash !== requestHash) {
    throw new ReservationError(
      409,
      "IDEMPOTENCY_CONFLICT",
      "This idempotency key was already used for a different reservation request."
    );
  }
  if (row.responseStatus === 0) {
    throw new ReservationError(
      409,
      "IDEMPOTENCY_IN_PROGRESS",
      "A reservation with this idempotency key is already being processed."
    );
  }
  return row.responseJson;
}

async function saveIdempotent(
  tx: Tx,
  key: string,
  operation: string,
  requestHash: string,
  response: ReservationResponse
): Promise<void> {
  await tx.$executeRaw`
    INSERT INTO idempotency_records (key, operation, "requestHash", "responseStatus", "responseJson", "createdAt")
    VALUES (${key}, ${operation}, ${requestHash}, ${201}, ${JSON.stringify(response)}::jsonb, NOW())
  `;
}

async function lockTransport(tx: Tx, id: string): Promise<LockedTransport> {
  const rows = await tx.$queryRaw<LockedTransport[]>`
    SELECT id, "availableKg", "capacityKg", "vehicleType"
    FROM transport_slots
    WHERE id = ${id}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) {
    throw new ReservationError(
      404,
      "TRANSPORT_SLOT_NOT_FOUND",
      `Transport slot ${id} does not exist.`
    );
  }
  return row;
}

async function lockStorage(tx: Tx, id: string): Promise<LockedStorage> {
  const rows = await tx.$queryRaw<LockedStorage[]>`
    SELECT id, "freeSlots", "totalSlots", "kgPerSlot", name
    FROM storage_facilities
    WHERE id = ${id}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) {
    throw new ReservationError(
      404,
      "STORAGE_FACILITY_NOT_FOUND",
      `Storage facility ${id} does not exist.`
    );
  }
  return row;
}

async function lockReservation(tx: Tx, id: string): Promise<LockedReservation> {
  const rows = await tx.$queryRaw<LockedReservation[]>`
    SELECT id, status::text AS status, "allocatedKg", "allocatedSlots", "expiresAt",
           "transportSlotId", "storageFacilityId", "requestedPlanKey"
    FROM reservations
    WHERE id = ${id}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) {
    throw new ReservationError(
      404,
      "RESERVATION_NOT_FOUND",
      `Reservation ${id} does not exist.`
    );
  }
  return row;
}

async function claimTransport(
  tx: Tx,
  slot: LockedTransport,
  allocatedKg: number
): Promise<void> {
  if (allocatedKg > slot.availableKg) {
    throw new ReservationError(
      409,
      "CAPACITY_EXCEEDED",
      `Requested ${allocatedKg} kg exceeds remaining capacity (${slot.availableKg} kg) on ${slot.vehicleType}.`
    );
  }
  const updated = await tx.$executeRaw`
    UPDATE transport_slots
    SET "availableKg" = "availableKg" - ${allocatedKg}
    WHERE id = ${slot.id} AND "availableKg" >= ${allocatedKg}
  `;
  if (updated !== 1) {
    throw new ReservationError(
      409,
      "CAPACITY_EXCEEDED",
      `Transport slot ${slot.id} was claimed by a concurrent booking.`
    );
  }
}

async function claimStorage(
  tx: Tx,
  facility: LockedStorage,
  allocatedKg: number
): Promise<number> {
  const slots = slotsForKilograms(allocatedKg, facility.kgPerSlot);
  if (slots > facility.freeSlots) {
    throw new ReservationError(
      409,
      "CAPACITY_EXCEEDED",
      `Requested ${allocatedKg} kg needs ${slots} slots, but ${facility.name} has ${facility.freeSlots} free slots.`
    );
  }
  const updated = await tx.$executeRaw`
    UPDATE storage_facilities
    SET "freeSlots" = "freeSlots" - ${slots}
    WHERE id = ${facility.id} AND "freeSlots" >= ${slots}
  `;
  if (updated !== 1) {
    throw new ReservationError(
      409,
      "CAPACITY_EXCEEDED",
      `Storage facility ${facility.id} was claimed by a concurrent booking.`
    );
  }
  return slots;
}

async function releaseTransport(
  tx: Tx,
  slotId: string,
  allocatedKg: number
): Promise<void> {
  await tx.$executeRaw`
    UPDATE transport_slots
    SET "availableKg" = LEAST("capacityKg", "availableKg" + ${allocatedKg})
    WHERE id = ${slotId}
  `;
}

async function releaseStorage(
  tx: Tx,
  facilityId: string,
  allocatedSlots: number
): Promise<void> {
  await tx.$executeRaw`
    UPDATE storage_facilities
    SET "freeSlots" = LEAST("totalSlots", "freeSlots" + ${allocatedSlots})
    WHERE id = ${facilityId}
  `;
}

async function expireDue(tx: Tx, now: Date): Promise<number> {
  const due = await tx.$queryRaw<LockedReservation[]>`
    SELECT id, status::text AS status, "allocatedKg", "allocatedSlots", "expiresAt",
           "transportSlotId", "storageFacilityId", "requestedPlanKey"
    FROM reservations
    WHERE status IN ('PENDING', 'CONFIRMED') AND "expiresAt" <= ${now}
    ORDER BY id
    FOR UPDATE
  `;
  for (const reservation of due) {
    if (reservation.transportSlotId) {
      await lockTransport(tx, reservation.transportSlotId);
      await releaseTransport(
        tx,
        reservation.transportSlotId,
        reservation.allocatedKg
      );
    }
    if (reservation.storageFacilityId && reservation.allocatedSlots) {
      await lockStorage(tx, reservation.storageFacilityId);
      await releaseStorage(
        tx,
        reservation.storageFacilityId,
        reservation.allocatedSlots
      );
    }
    await tx.$executeRaw`
      UPDATE reservations SET status = 'EXPIRED', "updatedAt" = NOW() WHERE id = ${reservation.id}
    `;
  }
  return due.length;
}

function toResponse(
  reservation: {
    id: string;
    status: ReservationStatus;
    allocatedKg: number;
    allocatedSlots: number | null;
    expiresAt: Date;
    transportSlotId: string | null;
    storageFacilityId: string | null;
    requestedPlanKey: string;
  },
  message: string
): ReservationResponse {
  return {
    reservationId: reservation.id,
    status: reservation.status,
    allocatedKg: reservation.allocatedKg,
    allocatedSlots: reservation.allocatedSlots,
    expiresAt: reservation.expiresAt.toISOString(),
    transportSlotId: reservation.transportSlotId,
    storageFacilityId: reservation.storageFacilityId,
    requestedPlanKey: reservation.requestedPlanKey,
    message,
  };
}

export interface BookInput {
  planId: string;
  allocatedKg: number;
  lockDurationMinutes: number;
  transportSlotId?: string;
  storageFacilityId?: string;
  idempotencyKey?: string;
  now?: Date;
}

export async function bookCapacity(
  input: BookInput,
  db: PrismaClient = getPrisma()
): Promise<ReservationResponse> {
  await ensureReservationSql(db);
  const requestHash = hashRequest("book", {
    planId: input.planId,
    allocatedKg: input.allocatedKg,
    lockDurationMinutes: input.lockDurationMinutes,
    transportSlotId: input.transportSlotId ?? null,
    storageFacilityId: input.storageFacilityId ?? null,
  });
  try {
    const rows = await db.$queryRaw<
      Array<{ reserve_hold: ReservationResponse }>
    >`
      SELECT reserve_hold(
        CAST(${input.planId} AS text),
        CAST(${input.allocatedKg} AS double precision),
        CAST(${input.lockDurationMinutes} AS integer),
        CAST(${input.transportSlotId ?? null} AS text),
        CAST(${input.storageFacilityId ?? null} AS text),
        CAST(${vehicleIdFromPlanKey(input.planId)} AS text),
        CAST(${randomUUID()} AS text),
        CAST(${input.idempotencyKey ?? null} AS text),
        CAST(${requestHash} AS text)
      ) AS reserve_hold
    `;
    const response = rows[0]?.reserve_hold;
    if (!response) {
      throw new ReservationError(
        500,
        "RESERVATION_FAILED",
        "The capacity function returned no reservation."
      );
    }
    return response;
  } catch (error) {
    const reservationError = reservationErrorFromDatabase(error);
    if (reservationError) throw reservationError;
    throw error;
  }
}

async function restoreReservation(
  tx: Tx,
  reservation: LockedReservation
): Promise<void> {
  if (reservation.transportSlotId) {
    await lockTransport(tx, reservation.transportSlotId);
    await releaseTransport(
      tx,
      reservation.transportSlotId,
      reservation.allocatedKg
    );
  }
  if (reservation.storageFacilityId && reservation.allocatedSlots) {
    await lockStorage(tx, reservation.storageFacilityId);
    await releaseStorage(
      tx,
      reservation.storageFacilityId,
      reservation.allocatedSlots
    );
  }
}

export async function cancelReservation(
  reservationId: string,
  db: PrismaClient = getPrisma()
): Promise<ReservationResponse> {
  return withReservationTransaction(async (tx) => {
    await expireDue(tx, new Date());
    const reservation = await lockReservation(tx, reservationId);
    if (
      reservation.status === "CANCELLED" ||
      reservation.status === "EXPIRED"
    ) {
      return toResponse(
        reservation,
        `Reservation is already ${reservation.status}.`
      );
    }
    if (!canTransition(reservation.status, "CANCELLED")) {
      throw new ReservationError(
        422,
        "INVALID_RESERVATION_TRANSITION",
        `A ${reservation.status} reservation cannot be cancelled.`
      );
    }
    await restoreReservation(tx, reservation);
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
    });
    return toResponse(
      updated,
      "Reservation cancelled and its capacity returned."
    );
  }, db);
}

export async function consumeReservation(
  reservationId: string,
  db: PrismaClient = getPrisma()
): Promise<ReservationResponse> {
  return withReservationTransaction(async (tx) => {
    const reservation = await lockReservation(tx, reservationId);
    if (reservation.status === "CONSUMED") {
      return toResponse(reservation, "Reservation is already consumed.");
    }
    if (!canTransition(reservation.status, "CONSUMED")) {
      throw new ReservationError(
        422,
        "INVALID_RESERVATION_TRANSITION",
        `A ${reservation.status} reservation cannot be consumed.`
      );
    }
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CONSUMED" },
    });
    return toResponse(
      updated,
      "Reservation consumed. The capacity stays allocated to this booking."
    );
  }, db);
}

export interface SwapInput {
  reservationId: string;
  transportSlotId?: string | null;
  storageFacilityId?: string | null;
  idempotencyKey?: string;
}

export async function swapReservation(
  input: SwapInput,
  db: PrismaClient = getPrisma()
): Promise<ReservationResponse> {
  const requestHash = hashRequest("swap", {
    reservationId: input.reservationId,
    transportSlotId: input.transportSlotId ?? null,
    storageFacilityId: input.storageFacilityId ?? null,
  });
  return withReservationTransaction(async (tx) => {
    if (input.idempotencyKey) {
      await advisoryLock(tx, input.idempotencyKey);
      const existing = await readIdempotent(
        tx,
        input.idempotencyKey,
        requestHash
      );
      if (existing) return existing;
    }
    const current = await lockReservation(tx, input.reservationId);
    if (current.status !== "CONFIRMED" && current.status !== "PENDING") {
      throw new ReservationError(
        422,
        "INVALID_RESERVATION_TRANSITION",
        `A ${current.status} reservation cannot be swapped.`
      );
    }
    if (current.expiresAt.getTime() <= Date.now()) {
      await restoreReservation(tx, current);
      await tx.reservation.update({
        where: { id: current.id },
        data: { status: "EXPIRED" },
      });
      throw new ReservationError(
        409,
        "RESERVATION_EXPIRED",
        "The original reservation expired before the swap and its capacity was released."
      );
    }

    const nextTransportId = input.transportSlotId ?? null;
    const nextStorageId = input.storageFacilityId ?? null;
    const transport = nextTransportId
      ? await lockTransport(tx, nextTransportId)
      : null;
    const storage = nextStorageId ? await lockStorage(tx, nextStorageId) : null;
    if (transport) await claimTransport(tx, transport, current.allocatedKg);
    const allocatedSlots = storage
      ? await claimStorage(tx, storage, current.allocatedKg)
      : null;
    await restoreReservation(tx, current);

    await tx.reservation.update({
      where: { id: current.id },
      data: { status: "CANCELLED" },
    });
    const created = await tx.reservation.create({
      data: {
        status: "CONFIRMED",
        requestedPlanKey: current.requestedPlanKey,
        transportSlotId: transport?.id,
        storageFacilityId: storage?.id,
        allocatedKg: current.allocatedKg,
        allocatedSlots,
        expiresAt: current.expiresAt,
      },
    });
    const response = toResponse(
      created,
      "Recovery swap committed. The previous hold was released and the new hold was taken in the same transaction."
    );
    if (input.idempotencyKey) {
      await saveIdempotent(
        tx,
        input.idempotencyKey,
        "swap",
        requestHash,
        response
      );
    }
    return response;
  }, db);
}

export async function getReservation(
  reservationId: string,
  db: PrismaClient = getPrisma()
): Promise<ReservationResponse> {
  return withReservationTransaction(async (tx) => {
    await expireDue(tx, new Date());
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      throw new ReservationError(
        404,
        "RESERVATION_NOT_FOUND",
        `Reservation ${reservationId} does not exist.`
      );
    }
    return toResponse(reservation, `Reservation is ${reservation.status}.`);
  }, db);
}

export async function availableTransportKg(
  slotId: string,
  db: PrismaClient = getPrisma()
): Promise<number> {
  const slot = await db.transportSlot.findUnique({ where: { id: slotId } });
  if (!slot) {
    throw new ReservationError(
      404,
      "TRANSPORT_SLOT_NOT_FOUND",
      `Transport slot ${slotId} does not exist.`
    );
  }
  return slot.availableKg;
}
