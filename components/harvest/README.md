# Harvest intake UI

This directory implements the client-side harvest registration form and its field feedback. The page is [`app/harvests/new/page.tsx`](../../app/harvests/new/page.tsx); a valid submission calls `POST /api/harvests`, whose service writes to the local harvest JSON store.

## Components

- [`HarvestForm`](HarvestForm.tsx) collects crop, kilograms, named origin and coordinates, harvest time, declared grade, temperature band, and shelf-life hours. It validates with the shared intake schema, reports service errors, and navigates to plan comparison after a successful registration.
- [`QualityGradeSelector`](QualityGradeSelector.tsx) renders the supported Grade A/B/C choice.
- [`HandlingProfileCard`](HandlingProfileCard.tsx) presents the temperature and shelf-life inputs.
- [`FieldValidationFeedback`](FieldValidationFeedback.tsx) renders a field error with an accessible description relationship.

The input schema and temporal validation rules are defined in [`lib/contracts/harvest.contract.ts`](../../lib/contracts/harvest.contract.ts). Registered harvests are persisted as local JSON under `data/harvests.json` by [`lib/planning/harvest-store.ts`](../../lib/planning/harvest-store.ts), or under `KHETSE_DATA_DIR` when set. This is not PostgreSQL persistence. Run a focused test from the root with `npx vitest run tests/unit/harvest-schema.test.ts tests/unit/harvest-service.test.ts`.
