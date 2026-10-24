# PostgreSQL access

This directory implements database access through the Prisma Client generated from [`prisma/schema.prisma`](../../prisma/schema.prisma). `client.ts` exposes a development-safe singleton, `databaseConfigured()` gate, and disconnect helper. `transactions.ts` runs a transaction at `ReadCommitted` isolation with up to three retries for serialization/deadlock/Prisma transaction conflicts.

## Queries

- `queries/reservations.ts` locks transport/storage rows, checks capacity, supports optional idempotency keys, creates/reads/cancels reservations, and atomically swaps held capacity. `reservation-sql.ts` provides the database-side locking/update SQL used by these operations.
- `queries/shipments.ts` creates shipments from confirmed, unexpired reservations, reads ordered events, and appends normal status transitions. It installs a PostgreSQL trigger preventing shipment-event updates/deletes.
- `queries/shipment-recovery.ts` records a simulated breakdown on the stored shipment without changing its reservation.
- `queries/scenarios.ts` restores capacity from the canonical baseline and removes demo shipment/reservation/idempotency records and local demo files; replay additionally calculates the named fixture outcome.

The reservation and shipment route handlers return 503 when `DATABASE_URL` is absent, and database connectivity/schema errors can still prevent a request. `DATABASE_URL` must point to PostgreSQL with the Prisma schema applied. No migrations are checked in. PGlite backs integration tests; these tests exercise query behavior in-process and do not require a separate database server. See [`docs/DATA_MODEL.md`](../../docs/DATA_MODEL.md), [`docs/API_CONTRACTS.md`](../../docs/API_CONTRACTS.md), and `tests/integration/`.
