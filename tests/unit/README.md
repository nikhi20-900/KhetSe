# Unit Tests (Planned)

## Planned Scope

This directory will contain isolated unit tests for pure domain functions and validation logic:

1. **Feasibility Rules (`tests/unit/feasibility.test.ts`)**:
   - Validation that payload exceeding vehicle capacity returns `CAPACITY_EXCEEDED`.
   - Verification that transit duration exceeding crop shelf-life returns `SHELF_LIFE_EXPIRED`.
   - Verification that thermal incompatibility returns `THERMAL_MISMATCH`.
2. **State Machine (`tests/unit/state-machine.test.ts`)**:
   - Verification of valid state progressions (`DRAFT` -> `BOOKED` -> `DISPATCHED` -> `IN_TRANSIT` -> `DELIVERED`).
   - Assertion that invalid transitions (e.g. `DELIVERED` -> `DISPATCHED`) throw structured transition errors.
3. **Simulation Clock & PRNG (`tests/unit/simulation.test.ts`)**:
   - Test verifying that running the simulation with `seed=42` produces 100% bit-for-bit identical event streams across runs.
4. **Financial Calculations (`tests/unit/financials.test.ts`)**:
   - Deterministic gross revenue, logistics cost, and net proceed calculation.
   - Counterfactual delta testing supporting positive, zero, and negative deltas.
5. **Intake Schema Validation (`tests/unit/validation.test.ts`)**:
   - Zod schema boundary tests for crop intake fields, negative weights, and malformed dates.

## Architectural Rule

Per project guidelines, fake test suites designed to pass without testing real behavior are strictly prohibited. Tests will be committed alongside functional logic under Issues #1-#8.
