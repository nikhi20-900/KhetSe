# Integration tests

Vitest integration tests exercise API handlers/services and Prisma query behavior against PGlite, an embedded PostgreSQL-compatible database configured by test helpers. They do not require an external PostgreSQL server.

- `reservations.test.ts` covers capacity reservations, conflicts, cancellation, idempotency, and swaps.
- `shipments.test.ts` covers shipment creation, persisted normal transitions, and chronological/append-only event behavior.
- `recovery-swap.test.ts` covers a successful PostgreSQL swap and failure behavior preserving the existing hold.
- `demo-flow.test.ts` joins the local harvest/planning path, database reservation/shipment operations, and incident/report behavior in an isolated test data directory.

Run the suite through `npm test` or focus a test with `npx vitest run tests/integration/<file>`. Production API handlers still require a configured PostgreSQL database and applied schema. The integration test harness is separate from deployment/database initialization.
