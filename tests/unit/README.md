# Unit tests

Vitest unit tests cover domain rules, contracts/services, and rendered component behavior without requiring a separately running PostgreSQL service.

- Harvest contract and local service: `harvest-schema.test.ts`, `harvest-service.test.ts`.
- Planning and booking/state logic: `feasibility.test.ts`, `booking.test.ts`, `state-machine.test.ts`.
- In-memory simulation and recovery rules: `simulation.test.ts`, `recovery.test.ts`.
- UI decisions and rendered pages/components: `human-approval-ui.test.tsx`, `recovery-ui.test.tsx`, `plan-components.test.ts`, `report-components.test.ts`.
- Report/scenario contract behavior: `shipment-report.test.ts`, `scenario-contract.test.ts`.

Run all checks with `npm test`. Run a focused file using `npx vitest run tests/unit/<file>`. Counterfactual tests call the domain comparison for registered scenarios, including positive, negative, and zero deltas. They do not treat those figures as a stored shipment's sale.
