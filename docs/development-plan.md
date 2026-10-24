# Development status and roadmap

This document summarizes repository implementation state by the original feature issues. GitHub issue lifecycle (open/closed) can differ from code state; use the source files and linked issue tracker for current assignment/review status.

## Current implementation

| Feature                                        | Repository status                    | Remaining limit                                                                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1 Demo data and evidence register             | Implemented                          | Canonical values/outcomes remain synthetic.                                                                                                                                                       |
| #2 Harvest intake and plan comparison          | Implemented                          | Harvest persistence is local JSON; planning uses a fixed catalog and modeled estimates.                                                                                                           |
| #3 Transactional capacity reservations         | Implemented                          | Requires PostgreSQL/schema setup; no migration workflow is checked in.                                                                                                                            |
| #4 Normal shipment lifecycle                   | Implemented in API/query layer       | PostgreSQL-backed normal API is distinct from the local Igatpuri UI demo.                                                                                                                         |
| #5 Deterministic transit simulation            | Implemented                          | In-memory simulation is isolated from DB operations; no GPS or live traffic.                                                                                                                      |
| #6 Incident alerts and human-approved recovery | Implemented for demo flow            | Local operations store; a capacity-changing recovery needs a linked PostgreSQL reservation and successful swap.                                                                                   |
| #7 Recovery and no-action comparison           | Implemented for registered scenarios | `counterfactual.ts` calls the reference calculator for two scenario ids. Reports still show the canonical pair because a shipment does not store a scenario id. Figures remain modeled estimates. |
| #8 Shipment report and resettable scenarios    | Partial                              | CSV/print and reset/replay UI/API exist; report collection APIs are 501, report envelope omits event/audit details, and scenario routes require PostgreSQL.                                       |

## Integration work still needed

- Define and implement a full persisted shipment report contract covering only verified stored records, then update the report UI and tests against that contract.
- Bind a stored shipment to a baseline scenario before treating report figures as that shipment's comparison. The current report is explicitly the canonical pair.
- Decide on and check in a reproducible Prisma schema/migration setup; the current repository has a Prisma schema and seed file but no migrations or seed command configuration.
- Connect the standalone local Igatpuri operations experience and the PostgreSQL shipment/reservation path through agreed contracts if a unified end-to-end UI is required.
- Add access controls before exposing database mutation APIs beyond a trusted local demo.

## Verification and contribution process

The package scripts and CI workflow are the source of truth for checks. CI runs `npm run format:check`, `npm run type-check`, `npm run validate-scaffold`, `npm run lint -- --max-warnings=0 || true`, and `npm test`. The lint command is explicitly non-blocking in the workflow at present. See [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) and [`CONTRIBUTING.md`](../CONTRIBUTING.md).
