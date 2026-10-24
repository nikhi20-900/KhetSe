# Database Client & Transaction Management

## Overview

This directory contains the database client singleton, transaction helpers, and query primitives interfacing with PostgreSQL via Prisma ORM.

## Planned Modules

- `client.ts`: Prisma Client singleton ensuring optimal connection pooling in Next.js App Router environments.
- `transactions.ts`: Concurrency and transaction wrapper utilities providing serializable isolation, row-level locking (`SELECT ... FOR UPDATE`), and idempotent retries.
- `queries/`: Modular, strongly-typed database query functions:
  - `harvests.ts`: Harvest record persistence.
  - `reservations.ts`: Atomic capacity check, slot hold, expiry, and recovery swap operations.
  - `shipments.ts`: State machine status mutations and immutable chronological event append operations.
  - `incidents.ts`: Disruption logging and human approval audit trails.

## Database Invariants

- **Database Boundary Enforcement:** Capacity constraints must be checked and locked within the database transaction, never assumed via in-memory caching.
- **Auditability:** State transitions append immutable event log records rather than destroying past milestone records.
- **Ownership:** Person 2 — Backend and database.
