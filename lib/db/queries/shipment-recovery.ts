import type { PrismaClient } from "@prisma/client";

import { getPrisma } from "@/lib/db/client";
import { ShipmentError } from "@/lib/db/queries/shipments";
import { withReservationTransaction } from "@/lib/db/transactions";

const DISRUPTION_FROM = new Set(["DISPATCHED", "IN_TRANSIT", "DISRUPTED"]);

/** Records a simulated breakdown on the stored shipment without changing its reservation. */
export async function recordShipmentDisruption(
  shipmentId: string,
  occurredAt: Date,
  db: PrismaClient = getPrisma()
): Promise<{ shipmentId: string; status: string }> {
  return withReservationTransaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: shipmentId },
      include: { events: { orderBy: { eventTime: "desc" }, take: 1 } },
    });
    if (!shipment) {
      throw new ShipmentError(
        404,
        "SHIPMENT_NOT_FOUND",
        `Shipment ${shipmentId} does not exist.`
      );
    }
    if (!DISRUPTION_FROM.has(shipment.status)) {
      throw new ShipmentError(
        422,
        "INVALID_SHIPMENT_TRANSITION",
        `${shipment.status} cannot record a breakdown.`
      );
    }
    if (shipment.status === "DISRUPTED") {
      return { shipmentId: shipment.id, status: shipment.status };
    }
    const latest = shipment.events[0]?.eventTime;
    if (latest && occurredAt.getTime() < latest.getTime()) {
      throw new ShipmentError(
        422,
        "EVENT_OUT_OF_ORDER",
        "The breakdown cannot be earlier than the latest shipment event."
      );
    }
    await tx.shipmentEvent.create({
      data: {
        shipmentId,
        eventType: "DISRUPTED",
        locationTag: "Nashik, Maharashtra",
        description:
          "Simulated breakdown recorded on the stored shipment. Capacity is unchanged until a person approves a recovery swap.",
        eventTime: occurredAt,
      },
    });
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: "DISRUPTED", currentLocation: "Nashik, Maharashtra" },
    });
    return { shipmentId: updated.id, status: updated.status };
  }, db);
}
