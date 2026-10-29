# Domain and simulation logic

This directory holds rules and calculations used by the planning, operations, and simulation flows. Modules are not all pure or complete: pure state/planning/simulation code is separated from API and database effects, while report modeling imports the fixture reference calculator.

- [`feasibility.ts`](feasibility.ts) evaluates the planning catalog against crop/origin registration, vehicle payload, declared temperature handling, shelf-life, and receiving windows; it ranks feasible plans and assigns objective labels.
- [`booking.ts`](booking.ts) provides reservation state/capacity helpers and the simulated kilogram-to-storage-slot mapping used by database queries.
- [`state-machine.ts`](state-machine.ts) defines the PostgreSQL normal shipment path (`BOOKED`, `DISPATCHED`, `IN_TRANSIT`, `DELIVERED`) and chronological guard helper.
- [`recovery.ts`](recovery.ts) builds the local Igatpuri demo state, modeled recovery choices, and validates human decisions. Persistence/atomic capacity swaps are handled in `lib/operations` and `lib/db`.
- [`simulation.ts`](simulation.ts) implements the in-memory deterministic virtual clock. [`simulation-lab.ts`](simulation-lab.ts) and [`simulation-control-room.ts`](simulation-control-room.ts) reprice registered disruption and response pairs with the comparison engine for `/simulation`. They do not write shipments or reservations.
- [`farmer-desk.ts`](farmer-desk.ts) prices the `/farmer` mandi and premium-buyer preview with the same calculator. [`farmer-replay.ts`](farmer-replay.ts) names the reproducible preview addresses. Neither module calls a reservation or shipment API.
- [`shipment-report.ts`](shipment-report.ts) copies the persisted shipment status and attaches the canonical alternative-recovery versus no-action comparison. It does not aggregate a complete shipment audit.
- [`counterfactual.ts`](counterfactual.ts) compares two scenario ids by calling the reference calculator. [`financials.ts`](financials.ts) itemizes that result. Neither module invents a second price formula, and neither treats the result as farmer income.

## Canonical data and boundaries

`data/demo-baseline.json` and `data/evidence-register.json` are tracked, synthetic reference fixtures. [`docs/assumptions.md`](../../docs/assumptions.md) documents their units, inputs, calculations, and limits. `scripts/reference-model.mjs` evaluates those reference scenarios for fixture validation and generated documentation; it is distinct from the app's transit simulation and planning evaluator. Harvest intake/catalog planning and the isolated transit simulator are also separate flows; passing a storage node in a route does not itself execute a storage operation.

Run `npm test` for domain, UI, API/query integration, fixture validation, and generated-document consistency checks. The virtual clock is in-memory and does not mutate reservations or the operational demo shipment. Synthetic figures are estimates, never measured prices or guaranteed proceeds.
