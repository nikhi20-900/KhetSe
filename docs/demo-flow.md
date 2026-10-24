# KhetSe demonstration walkthrough

## Functional baseline and next owner

Use functional `main` at `9329b1a` (scenario controls merged), or a descendant
reviewed for functional changes. Issue #5 simulation is merged. **Person 3 should
own Issue #7 next**, with Person 2 reviewing persistence and report integration.
The counterfactual domain module is still a placeholder: current report numbers
come from the canonical reference calculator, not a shipment-specific comparison
engine. Do not present Issue #7 as complete.

All operational inputs and results are **SIMULATED**. Read the
[evidence register](evidence-register.md) and generated [assumptions](assumptions.md).
Prices, decay and route values are assumptions, not measured income gains.

## Keep design work separate

- Redesign commit `944f834` belongs on its separate design branch. It is preserved
  locally as `preserve/redesign-944f834` and is not an ancestor of this walkthrough's
  functional baseline. Do not merge or cherry-pick it for this demo.
- Keep stash `be6ac33` in its originating checkout. It was not available in this
  checkout on 25 October 2026; the local stash list was empty. Its preservation
  cannot be verified here. Do not pop, apply, drop or clear it during functional work.
- Start functional work from reviewed `main` on its own branch. Check `git status`,
  `git log` and `git stash list` before switching contexts. Never reset a teammate's
  checkout to make it match this walkthrough.

## Preflight with Person 2

1. Confirm both presenters use the same functional commit. Person 2 owns the
   database/API checks; Person 3 owns simulation and modeled-result checks.
2. Use a disposable demo database and a dedicated `KHETSE_DATA_DIR`. Scenario
   reset/replay deletes demo operational records and restores resource capacity;
   it must not target a shared or production database.
3. Install dependencies and generate Prisma before starting the app:

   ```sh
   npm ci
   npm run prisma:generate
   npm test
   npm run type-check
   npm run lint
   npm run format:check
   npm run demo
   npm run build
   npm run dev
   ```

4. Person 2 supplies `DATABASE_URL` for the disposable database, applies the Prisma
   schema and loads its demo resources. Never paste credentials into demo notes.
   The automated integration tests create their own PGlite databases, apply the
   schema, seed their fixtures and clean up; they need no production connection.
5. Run the backend walkthrough independently if troubleshooting:

   ```sh
   npx vitest run tests/integration/demo-flow.test.ts tests/integration/recovery-swap.test.ts tests/integration/shipments.test.ts tests/integration/reservations.test.ts
   ```

## Live walkthrough

| Step        | Presenter action                                                                            | Check / explanation                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intake      | Open `/harvests/new`, use the 10,000 kg Nashik Red Onion demo defaults and submit.          | Record the returned harvest ID. The demo origin is Pimpalgaon Baswant. The intake date must satisfy the current form window; the canonical simulation's dispatch timestamp remains fixed.                                  |
| Plans       | Open the returned plan comparison.                                                          | Show a feasible option and the machine-readable rejection of a 7,500 kg reefer for this 10,000 kg lot. The intake catalog and canonical register differ; do not mix their prices or route distances.                       |
| Reservation | Reserve an available transport resource for the chosen plan.                                | Person 2 verifies confirmed capacity, persisted reservation ID and duplicate-request protection. Use actual returned IDs throughout.                                                                                       |
| Shipment    | Create the shipment from that reservation and advance its normal lifecycle.                 | Person 2 checks chronological events and persisted status. The normal-path integration test separately verifies delivery and reservation consumption.                                                                      |
| Simulation  | Open `/simulation`; play, pause, step, accelerate, then reset.                              | This is an isolated in-memory transit demo, not a control for the persisted shipment. Seed 42 and identical actions reproduce history. Arrival stops the clock; unloading is outside this engine.                          |
| Disruptions | Select normal, delay and breakdown simulation scenarios.                                    | Arrival times are 6.5 h, 16.5 h and 30.5 h respectively. Delay occurs at Igatpuri; the canonical breakdown occurs at Nashik. Quality follows the registered environment profile.                                           |
| Approval    | Open `/shipments/demo-igatpuri`, inject its breakdown and follow the incident link.         | This operational demo uses its own Igatpuri fixture. Explain that it is separate from the canonical Nashik simulation. An option preview must not commit a recovery.                                                       |
| Recovery    | Select a feasible recovery and supply explicit coordinator/manager approval where required. | Person 2 verifies the PostgreSQL swap when linked. The Nashik demo uses the baseline ventilated truck rate (₹2,800 plus ₹38/km); failed swaps leave the original hold intact.                                              |
| No action   | Reset the dedicated demo, inject again, and explicitly select no action.                    | Show the recorded decision; do not describe no action as abandonment or a forced zero-value sale.                                                                                                                          |
| Report      | Open `/reports/<persisted-shipment-id>`.                                                    | The UI calls `/api/reports/<id>`; the collection `/api/reports` is still a placeholder. Compare persisted status with the separate modeled financial rows. A `REROUTED` shipment must not be presented as delivered.       |
| Export      | Export CSV and open it; optionally print.                                                   | Verify shipment ID, persisted status, simulated label and modeled values agree with the screen. A rendered report alone does not verify browser download behavior.                                                         |
| Restore     | Use report reset/replay controls after confirming the disposable database.                  | `POST /api/scenarios` accepts reset or replay with a registered scenario ID. Verify capacity restoration and removal of demo records and the local harvest file. Replay returns a modeled outcome; it creates no shipment. |

The integration test `tests/integration/demo-flow.test.ts` exercises intake → plan
→ reservation → dispatch → transit → disruption → approved PostgreSQL recovery →
report rows → replay/capacity restoration. It calls services directly, not browser
controls or HTTP handlers. Its recovery path ends at `REROUTED`, not `DELIVERED`.
The separate normal shipment test verifies the delivered path. Passing these is
strong integration evidence, not proof that the entire live UI demo passed.

## Modeled comparison reference

Run `npm run demo` to reproduce all six canonical fixture results. It does not
create a shipment, reserve capacity or execute an approval.

| Case                  | Modeled net proceeds (INR) | Interpretation                             |
| --------------------- | -------------------------: | ------------------------------------------ |
| Normal delivery       |                 258,428.17 | Undisrupted reference                      |
| Paid breakdown repair |                 187,074.40 | 24-hour repair                             |
| Transit delay         |                 193,879.60 | Includes missed receiving slot             |
| Alternative recovery  |                 229,586.71 | Canonical storage/replacement branch       |
| No action             |                  85,256.04 | Included repair, then continuation         |
| Negative recovery     |                -118,813.16 | Intervention costs exceed salvage proceeds |

The canonical alternative-recovery delta against no action is INR 144,330.67.
This is a fixture result, not realized farmer profit. See the assumptions for
itemized fees, quantity loss, grade discounts, exclusions and units.

## Issue #7 handoff — Person 3

- Freeze quantity, initial quality, harvest/dispatch time, incurred costs and the
  pre-incident state before comparing branches.
- Share the seed, price assumptions and degradation curve across both branches.
- Implement the production financial/counterfactual modules and connect their
  result to the report contract with Person 2. Retain persisted shipment status
  separately from the modeled outcome.
- Test positive, zero and negative deltas, identical-branch zero delta, price
  swings, degradation rates and recovery costs. Display financial line items,
  uncertainty and excluded externalities as modeled estimates.
- Reconcile the legacy operational catalog and canonical register explicitly;
  do not silently mix them or replace fixture provenance.

## Final joint sign-off

Record the functional SHA, disposable environment, test output, shipment and
reservation IDs, incident decision, report/CSV comparison, reset/replay result,
and the two presenters' actual review. Check normal, approved recovery, no-action
and negative-cost cases. Leave browser, HTTP and human-review items pending until
observed. Automated results alone must not be signed off on behalf of Person 2.

### Automated rehearsal record — 25 October 2026

On functional baseline `9329b1a`, `npm test` passed **98 tests in 18 files**,
including the harvest-through-report integration flow, recovery swaps, normal
shipment delivery and reservation concurrency. Fixture validation and generated
documentation checks passed. `npm run demo` reproduced all six reference scenarios
and the values above. Documentation formatting and `git diff --check` passed.

The joint live browser/HTTP walkthrough, downloaded CSV inspection and Person 2's
sign-off remain pending. No claim of their participation is implied by these tests.
Stash `be6ac33` still requires verification in its original checkout.
