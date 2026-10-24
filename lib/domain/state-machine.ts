/**
 * Normal-delivery shipment transitions.
 * Disruption and reroute states remain for later issues and are not
 * accepted by this path.
 */

export const NORMAL_SHIPMENT_STATUSES = [
  "BOOKED",
  "DISPATCHED",
  "IN_TRANSIT",
  "DELIVERED",
] as const;

export type NormalShipmentStatus = (typeof NORMAL_SHIPMENT_STATUSES)[number];

/** Node name from data/demo-baseline.json. Simulated context, not a surveyed gate. */
export const DEMO_DISPATCH_LOCATION = "Pimpalgaon Baswant, Maharashtra";

const TRANSITIONS: Record<
  NormalShipmentStatus,
  readonly NormalShipmentStatus[]
> = {
  BOOKED: ["DISPATCHED"],
  DISPATCHED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
};

export function isNormalShipmentStatus(
  status: string
): status is NormalShipmentStatus {
  return (NORMAL_SHIPMENT_STATUSES as readonly string[]).includes(status);
}

export function canTransitionShipment(
  from: NormalShipmentStatus,
  to: NormalShipmentStatus
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertChronological(previous: Date, next: Date): boolean {
  return next.getTime() >= previous.getTime();
}
