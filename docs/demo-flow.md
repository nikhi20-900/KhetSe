# KhetSe demonstration walkthrough

Functional `main` includes harvest intake, plan comparison, PostgreSQL reservations,
the normal shipment API, the Igatpuri recovery screen, the shipment report, scenario
reset/replay, the deterministic `/simulation` clock, and the warm visual redesign.
Issue #7 is not complete: `lib/domain/counterfactual.ts` is still a placeholder.
Report money figures come from the canonical reference calculator.

All operational inputs and results are **SIMULATED**. The generated tables in
[assumptions.md](assumptions.md) are the expected fixture outputs. `npm run demo`
prints them and does not create a shipment or write to a database.

The redesign commit `944f834` is merged through pull request #21. Stash `be6ac33`
is the original recovery stash. Do not drop, pop, or apply it while rehearsing.

## Checks

```sh
npm ci
npm run prisma:generate
npm test
npm run type-check
npm run lint
npm run format:check
npm run demo
npm run dev
```

`npm test` covers the baseline scenarios, reservations, shipments, the recovery
swap, and the harvest-to-report flow. Those integration tests use their own
embedded databases. A live rehearsal needs `DATABASE_URL` and the Prisma schema
on a disposable database. Reset and replay delete demo shipments, reservations,
and the local harvest file.

## Walkthrough

1. **Harvest** at `/harvests/new`. Submit the 10,000 kg Nashik Red Onion lot from
   Pimpalgaon Baswant. Grade and coordinates are simulated inputs.
2. **Plans** at `/plans?harvestId=...`. Feasible and rejected cards are both shown.
   A reefer van is rejected for this lot on payload and temperature. Plan-card
   prices come from the planning catalog. They are not the same numbers as the
   canonical baseline vehicle register.
3. **Reservation** at `/reservations/new`. This creates a PostgreSQL hold. One
   storage slot represents 1,000 kg. A conflicting booking is refused.
4. **Dispatch.** There is no dispatch screen. `POST /api/shipments` records
   `BOOKED` and then `DISPATCHED` when a dispatch time is included.
   `POST /api/shipments/{id}/transitions` advances `IN_TRANSIT` and `DELIVERED`.
   `/shipments/demo-igatpuri` is a separate simulated story, not that stored shipment.
5. **Breakdown.** Inject it on `/shipments/demo-igatpuri`. That action does not
   change a PostgreSQL reservation. The stored shipment is marked `DISRUPTED` by
   `tests/integration/demo-flow.test.ts`, which calls the shipment recovery helper.
6. **Recovery** at `/incidents/inc_demo_igatpuri`. Nashik cold storage is offered
   at ₹2,800 plus ₹38/km from the baseline ventilated truck. Vashi cannot hold
   10,000 kg. No action is always present. Approval needs a named person, manager
   sign-off when the receiving window changes, and an explicit checkbox. With no
   linked PostgreSQL reservation, the decision is refused and nothing is marked
   executed. A linked consumed hold is swapped in one transaction; a failed claim
   leaves that hold intact. A confirmed swap sets the stored shipment to `REROUTED`.
7. **Report** at `/reports/{shipmentId}`. **Persisted shipment status** is the
   status on the shipment row. Recovery and no-action amounts are a separate
   modeled comparison. They do not replace the status and they are not a completed
   sale. CSV export uses the same rows. `GET /api/reports` and `POST /api/reports`
   still return 501.
8. **Reset and replay** on the report page call `POST /api/scenarios`. Reset
   restores baseline capacity and deletes demo operational records. Replay does
   that and returns the reference-model outcome for a scenario id in
   `data/demo-baseline.json`. It does not create a shipment. An unknown id is
   rejected.

`/simulation` is an in-memory clock. Normal, delay, and breakdown arrivals in the
canonical fixture are 6.5 h, 16.5 h, and 30.5 h. It does not control the stored
shipment.

## Modeled comparison

| Case                  | Modeled net proceeds (INR) | Reading                                      |
| --------------------- | -------------------------: | -------------------------------------------- |
| Normal delivery       |                 258,428.17 | Undisrupted reference                        |
| Paid breakdown repair |                 187,074.40 | 24-hour repair                               |
| Transit delay         |                 193,879.60 | Missed receiving slot                        |
| Alternative recovery  |                 229,586.71 | Positive delta versus no action: 144,330.67  |
| No action             |                  85,256.04 | Included repair, then continuation           |
| Negative recovery     |                -118,813.16 | Negative delta versus no action: -204,069.20 |

These are fixture results, not farmer profit. A zero delta is not a registered
scenario. It would require two identical branches. `lib/domain/counterfactual.ts`
does not calculate that yet.

## Issue #7

Person 3 still owns the comparison engine. The report already shows the
alternative-recovery and no-action pair from the reference calculator. Positive
and negative fixture deltas are in the table above. The missing work is a
shipment-specific comparison, an identical-branch zero delta, and itemized cost
lines in the product UI.
