/**
 * Capacity Booking & Reservation Domain Logic (Specification & Placeholder)
 *
 * Planned Scope:
 * 1. Define reservation states: PENDING, CONFIRMED, CANCELLED, EXPIRED, CONSUMED.
 * 2. Define capacity reservation invariants:
 *    - Sum of confirmed + active pending reservations <= facility total capacity.
 *    - In-transit recovery swaps must atomically release former allocation and secure new allocation.
 * 3. Evaluate lock expiration windows and automated cleanup thresholds.
 *
 * Tracked in:
 * - GitHub Issue #3 (Add transactional capacity reservations)
 *
 * Owners:
 * - Person 2 — Backend and database (Database transaction implementation)
 * - Person 3 — Domain logic, simulation, and QA (Domain invariants)
 */

// TODO(Issue-3): Define ReservationStatus enum and state transition guards.
// TODO(Issue-3): Define capacity calculation invariants and bounds checking logic.
// TODO(Issue-3): Define atomic swap semantics interface for recovery execution.

export const BOOKING_DOMAIN_STATUS = "SCAFFOLD_ONLY" as const;
