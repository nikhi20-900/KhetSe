# API and UI contracts

This directory contains shared Zod schemas and TypeScript response types. API handlers parse untrusted request bodies with these schemas; client pages use the same types/schemas where they validate form or report data. Detailed route behavior is in [`docs/API_CONTRACTS.md`](../../docs/API_CONTRACTS.md).

- [`harvest.contract.ts`](harvest.contract.ts): intake fields, date-relative validation, and registered harvest response types.
- [`plan.contract.ts`](plan.contract.ts): planning request and feasible/rejected plan result shapes, estimate labels, and rejection codes.
- [`reservation.contract.ts`](reservation.contract.ts): reservation creation/swap validation and response structure.
- [`shipment.contract.ts`](shipment.contract.ts): shipment creation and normal-transition request schemas and response types.
- [`incident.contract.ts`](incident.contract.ts): recovery decision and breakdown injection inputs plus demo IDs.
- [`report.contract.ts`](report.contract.ts): current limited shipment report shape, displayed rows, and CSV serialization.
- [`scenario.contract.ts`](scenario.contract.ts): reset/replay commands validated against scenario IDs from the canonical baseline fixture.
- [`problem.ts`](problem.ts): problem-details shape and Zod validation error conversion. Harvest/plans and other APIs use this in differing ways; not every placeholder response is problem-details JSON.

These contracts describe the current implementation, not a promise that every endpoint or report field is complete. In particular, `GET /api/reports/{id}` exposes only the currently defined report envelope; `GET` and `POST /api/reports` remain 501. Do not add client fields without agreeing on and implementing their API contract. Financial values must retain their explicit modeled/synthetic meaning.
