# End-to-End Scenario Tests (Planned)

## Planned Scope

This directory will contain deterministic end-to-end scenario tests evaluating complete harvest-to-delivery journeys:

1. **Scenario A: Normal Happy Path (`tests/scenarios/normal-delivery.test.ts`)**:
   - Intake: 10,000 kg Nashik Red Onion.
   - Plan: Direct Ventilated Truck to Vashi APMC.
   - Execution: On-time transit, zero disruptions, full delivery receipt.
   - Report: Verifies accurate financial reconciliation and delivery audit trail.
2. **Scenario B: Breakdown with Successful Recovery (`tests/scenarios/breakdown-recovery.test.ts`)**:
   - Transit: Vehicle breakdown triggered at virtual checkpoint 2 (Igatpuri Ghat).
   - Disruption: Incident alert displayed with recovery alternatives.
   - Action: Human approval granted for emergency cold storage offload at Nashik Pre-Cooling.
   - Outcome: Spoilage minimized, positive counterfactual delta vs. no-action baseline.
3. **Scenario C: Transit Delay with No-Action Alternative (`tests/scenarios/delay-no-action.test.ts`)**:
   - Transit: Road closure delay of 18 hours.
   - Action: Decision-maker chooses No-Action (avoiding secondary transport cost).
   - Outcome: Grade depreciation observed at destination; verifies accurate modeled spoilage loss.
4. **Scenario D: Negative Recovery Scenario (`tests/scenarios/negative-recovery.test.ts`)**:
   - Context: Breakdown near low-value secondary market where replacement reefer dispatch cost exceeds crop salvage value.
   - Outcome: Demonstrates negative counterfactual delta, verifying honest and unbiased financial modeling.

## Architectural Rule

Scenario scripts will execute deterministically via the virtual clock engine once Issues #5, #6, #7, and #8 are completed.
