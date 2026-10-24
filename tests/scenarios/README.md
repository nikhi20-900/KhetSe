# Scenario tests

## Implemented: issue #1 baseline verification

`demo-baseline.test.mjs` runs under the repository's Vitest configuration. It checks:

- The canonical data and evidence records, standardized units and valid coordinates.
- Fixed directed routes, valid times, vehicle weight/volume and storage intake limits.
- All six reference outcomes against independent financial and timing calculations.
- Slot boundaries, grade thresholds, deterministic repeated runs and shared sunk costs.
- Positive recovery and a forced negative outcome where intervention exceeds salvage.

Run `npm test`; it also validates all inputs and checks generated documentation for
drift. The tested `.mjs` files are Node fixture-verification tools in `scripts/`,
not the application's future TypeScript domain services.

## Pending: application integration

Issues #5 through #8 will test the same canonical scenarios through the actual
virtual clock, event history, human approval, database reservations and reports.
Use [`data/demo-baseline.json`](../../data/demo-baseline.json) and
[`docs/assumptions.md`](../../docs/assumptions.md), not the old scaffold's example
times or invented financial outcomes. Database and UI integration are not exercised
by the fixture regression suite.
