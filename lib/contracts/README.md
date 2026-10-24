# Shared Contracts & Schemas

## Overview

This directory serves as the single source of truth for TypeScript types, interfaces, and Zod validation schemas shared across the frontend, API routes, and domain simulation layers.

## Planned Contract Modules

- `harvest.contract.ts`: Schemas for harvest registration, crop specifications, quality grading, and origin. Implemented for [Issue #2](https://github.com/nikhi20-900/khetse/issues/2).
- `plan.contract.ts`: Feasible and rejected logistics plans, constraint categories, cost breakdowns, and the plan-selection handoff. Implemented for [Issue #2](https://github.com/nikhi20-900/khetse/issues/2).
- `reservation.contract.ts`: Request/response schemas for atomic transport and storage capacity bookings and swaps. (Tracked in [Issue #3](https://github.com/nikhi20-900/khetse/issues/3))
- `shipment.contract.ts`: State machine status enums, milestone event payloads, and transition command schemas. (Tracked in [Issue #4](https://github.com/nikhi20-900/khetse/issues/4))
- `incident.contract.ts`: Disruption alert schemas, impact assessment models, and human sign-off payloads. (Tracked in [Issue #6](https://github.com/nikhi20-900/khetse/issues/6))
- `financials.contract.ts`: Transparent itemized cost structures, gross/net proceeds schemas, and counterfactual comparison records. (Tracked in [Issue #7](https://github.com/nikhi20-900/khetse/issues/7))

## Invariants

1. All client inputs must be validated against shared Zod schemas before hitting business logic.
2. Error responses must follow the RFC 7807 problem details specification.
3. Financial figures must be represented in integer units (e.g., paisa or whole rupees) to prevent floating point inaccuracies.
