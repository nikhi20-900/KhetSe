/**
 * Reservation invariants that do not talk to the database.
 * The PostgreSQL transaction in lib/db/queries/reservations.ts is what
 * enforces them under concurrency.
 */

export const RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "CONSUMED",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/**
 * Simulated persistence mapping from the canonical kilogram baseline.
 * One storage slot represents 1,000 kg. Slots are not stored as kilograms.
 */
export const SIMULATED_KG_PER_SLOT = 1_000;

const ACTIVE_STATUSES = new Set<ReservationStatus>(["PENDING", "CONFIRMED"]);

const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["CANCELLED", "EXPIRED", "CONSUMED"],
  CANCELLED: [],
  EXPIRED: [],
  CONSUMED: [],
};

export function canTransition(
  from: ReservationStatus,
  to: ReservationStatus
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function holdsCapacity(status: ReservationStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function slotsForKilograms(
  quantityKg: number,
  kgPerSlot: number
): number {
  if (!(quantityKg > 0) || !(kgPerSlot > 0)) {
    throw new Error("Capacity quantities must be positive.");
  }
  const scaledKg = Math.round(quantityKg * 1_000);
  const scaledSlot = Math.round(kgPerSlot * 1_000);
  return Math.ceil(scaledKg / scaledSlot);
}

export function dailySlotRateInr(
  holdingInrPerKgHour: number,
  kgPerSlot = SIMULATED_KG_PER_SLOT
): number {
  return Math.round(holdingInrPerKgHour * 24 * kgPerSlot);
}

export function vehicleIdFromPlanKey(planKey: string): string | null {
  if (planKey.includes("ventilated")) return "ventilated-10t";
  if (planKey.includes("reefer")) return "reefer-van";
  if (planKey.includes("standard")) return "standard-10t";
  return null;
}

export function lockExpiry(now: Date, lockDurationMinutes: number): Date {
  return new Date(now.getTime() + lockDurationMinutes * 60_000);
}
