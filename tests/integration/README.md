# Integration Tests (Planned)

## Planned Scope

This directory will contain integration tests verifying interactions between API routes, transactional database operations, and state transitions:

1. **Transactional Capacity Reservations (`tests/integration/reservations.test.ts`)**:
   - Concurrency tests: simulate concurrent booking requests for a finite slot and verify that overbooking is prevented at the database boundary.
   - Rollback tests: verify that failed multi-leg bookings leave zero orphaned slots.
   - Expiration tests: verify that expired unconfirmed locks are restored to available inventory.
2. **Shipment Event Persistence (`tests/integration/shipments.test.ts`)**:
   - Verification of sequential, immutable event appending in PostgreSQL.
   - Verification that event timestamps are strictly monotonically increasing.
3. **Atomic Recovery Swaps (`tests/integration/recovery-swap.test.ts`)**:
   - Verification that in-transit breakdown recovery atomically releases the previous reservation and acquires the new vehicle/storage slot within a single transaction.
   - Verification that failure to acquire the recovery slot aborts cleanly without dropping the existing booking.

## Architectural Rule

No fake or empty passing tests. Integration test harnesses will be wired to a containerized PostgreSQL test database upon implementation of Issues #3 and #4.
