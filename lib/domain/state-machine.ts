/**
 * Shipment Lifecycle State Machine (Specification & Placeholder)
 *
 * Planned Scope:
 * 1. Define formal shipment lifecycle states:
 *    - DRAFT: Initial configuration.
 *    - BOOKED: Capacity reserved and awaiting dispatch.
 *    - DISPATCHED: Vehicle loaded and departed origin.
 *    - IN_TRANSIT: Moving across geographic checkpoints.
 *    - DISRUPTED: In-transit incident detected (breakdown, delay).
 *    - REROUTED: Human-approved recovery plan activated with new destination/vehicle.
 *    - DELIVERED: Successfully received at destination market or warehouse.
 *    - ABORTED: Terminated due to total loss or distress liquidation.
 * 2. Define valid state transition matrix and guard conditions.
 * 3. Reject invalid transitions with structured domain errors.
 *
 * Tracked in:
 * - GitHub Issue #4 (Build shipment lifecycle and normal delivery path)
 * - GitHub Issue #6 (Add disruption alerts and human-approved recovery)
 *
 * Owners:
 * - Person 3 — Domain logic, simulation, and QA (State machine specification & rules)
 * - Person 2 — Backend and database (Persistence & event log appending)
 */

// TODO(Issue-4): Define ShipmentState type and transition validation functions.
// TODO(Issue-4): Define ShipmentEvent payload types (DISPATCHED, CHECKPOINT_PASSED, INCIDENT_FLAGGED, RECOVERY_APPLIED, DELIVERED).
// TODO(Issue-4): Define guard functions ensuring chronological monotonicity.

export const STATE_MACHINE_STATUS = "SCAFFOLD_ONLY" as const;
