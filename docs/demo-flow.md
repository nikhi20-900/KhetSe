# KhetSe demonstration walkthrough

Functional `main` includes harvest intake, plan comparison, PostgreSQL reservations,
the normal shipment API, the Igatpuri recovery screen, the shipment report, scenario
reset/replay, the Simulation Lab at `/simulation`, and the warm visual redesign.
`lib/domain/counterfactual.ts` compares two registered baseline scenarios by calling
the reference calculator. It does not keep a second price formula. A stored
shipment has no scenario id, so the report publishes the canonical
alternative-recovery and no-action pair and labels that scope.

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
on a disposable database. Point `KHETSE_DATA_DIR` at an empty directory so reset
does not delete the repository's `data/` files. Reset and replay delete demo
shipments, reservations, and the local harvest file in that directory.

`npm run build` and `npm run dev` share `.next`. Stop the dev server for this
checkout before a production build. After `npm run build`, remove `.next` and
start `npm run dev` again. A build left in place makes `/simulation` return 500.
Confirm the fresh server with `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/simulation`
and expect `200`. Use another port if 3000 is already taken. Do not stop dev
servers that belong to a different checkout.

## Walkthrough

1. **Farmer desk** at `/farmer`. This is the farmer journey. Choose Nashik Red
   Onion. Tomato and grape stay unsupported because they have no registered
   price. The map uses the baseline mandi coordinates and prices. A mandi
   choice ends after the modeled margin. The Pune premium buyer continues into
   a photo attachment and registered cold-van checkpoints. A breakdown there
   shows the modeled alternatives and does not promise that the farmer avoids a
   loss. The generated report stays in the browser. It is not a persisted
   shipment. Repeat the same figures without touching the database:
   `/farmer?replay=vashi-mandi` (net ₹2,58,428.17),
   `/farmer?replay=pune-premium` (net ₹2,29,586.71), and
   `/farmer?replay=breakdown` (repair delta ₹1,01,818.36, cold-room delta
   ₹1,44,330.67, no-action delta ₹0.00). An unknown `replay` value stays on crop
   choice. Harvest intake from the preview does not copy those figures onto a
   shipment.
2. **Harvest** at `/harvests/new`. Submit the 10,000 kg Nashik Red Onion lot from
   Pimpalgaon Baswant. Grade and coordinates are simulated inputs.
3. **Plans** at `/plans?harvestId=...`. Feasible and rejected cards are both shown.
   A reefer van is rejected for this lot on payload and temperature. Plan-card
   prices come from the planning catalog. A ventilated card uses ₹72/km. The
   recovery comparison uses the baseline vehicle register, where that truck is
   ₹2,800 plus ₹38/km. The plan screen states this distinction.
4. **Reservation** at `/reservations/new`. This creates a PostgreSQL hold. One
   storage slot represents 1,000 kg. A conflicting booking is refused.
5. **Dispatch.** After a confirmed hold, **Dispatch this hold** calls
   `POST /api/shipments` with a dispatch time. The same screen can record
   `IN_TRANSIT` and `DELIVERED` through `POST /api/shipments/{id}/transitions`.
   Opening `/shipments/{id}` shows that stored record. `/shipments/demo-igatpuri`
   remains a separate simulated story, not that stored shipment. Disruption of
   the stored shipment is still not exposed as an HTTP route.
6. **Breakdown.** Inject it on `/shipments/demo-igatpuri`. That action does not
   change a PostgreSQL reservation. The stored shipment is marked `DISRUPTED` by
   `tests/integration/demo-flow.test.ts`, which calls the shipment recovery helper.
7. **Recovery** at `/incidents/inc_demo_igatpuri`. Nashik cold storage is offered
   at ₹2,800 plus ₹38/km from the baseline ventilated truck. Vashi cannot hold
   10,000 kg. No action is always present. Approval needs a named person, manager
   sign-off when the receiving window changes, and an explicit checkbox. With no
   linked PostgreSQL reservation, the decision is refused and nothing is marked
   executed. A linked consumed hold is swapped in one transaction; a failed claim
   leaves that hold intact. A confirmed swap sets the stored shipment to `REROUTED`.
8. **Report** at `/reports/{shipmentId}`. **Persisted shipment status** is the
   status on the shipment row. Recovery and no-action amounts are a separate
   modeled comparison. They do not replace the status and they are not a completed
   sale. CSV export uses the same rows. `GET /api/reports` and `POST /api/reports`
   still return 501.
9. **Reset and replay** on the shipment report call `POST /api/scenarios`.
   Reset restores baseline capacity and deletes demo operational records,
   including stored shipments. Replay does that and returns the reference-model
   outcome for `alternative-recovery`. The screen shows that modeled net and
   states that it is not a persisted shipment outcome. It does not create a
   shipment. An unknown id is rejected. This database command is separate from
   the farmer-desk replay links, which do not call it.

`/simulation` is the Simulation Lab. Apply a setup for the registered
10,000 kg Nashik Red Onion lot, then start, pause, resume, or reset simulated
time. Inject a breakdown, an Igatpuri delay, a stalled-hot temperature
excursion, or a storage-capacity check. Repair, Nashik reroute, and no action
are priced only when a registered scenario supports them. Vashi cold storage is
rejected for the 10,000 kg lot. The expensive reefer case is shown so a
negative delta remains visible. The lower transit clock is separate. Neither
control writes a shipment or reservation. `GET /api/simulation/preview` returns
the same preview and does not touch the database.

## Modeled comparison

| Case                  | Modeled net proceeds (INR) | Reading                                      |
| --------------------- | -------------------------: | -------------------------------------------- |
| Normal delivery       |                 258,428.17 | Undisrupted reference                        |
| Paid breakdown repair |                 187,074.40 | 24-hour repair                               |
| Transit delay         |                 193,879.60 | Missed receiving slot                        |
| Alternative recovery  |                 229,586.71 | Positive delta versus no action: 144,330.67  |
| No action             |                  85,256.04 | Included repair, then continuation           |
| Negative recovery     |                -118,813.16 | Negative delta versus no action: -204,069.20 |

These are fixture results, not farmer profit. Comparing no action with itself
returns a zero delta. That is not a seventh registered scenario. The report
compares the registered alternative-recovery and no-action scenarios. It does
not reconstruct a stored Pune delivery. For those scenarios the itemized cost
lines add up to the logistics total. The reference net is rounded from the
unrounded gross and costs, so alternative recovery's displayed gross minus
displayed logistics is ₹2,29,586.72 while the reference net used for the delta
is ₹2,29,586.71. The report states that one-paise reconciliation.

## Issue #7

The comparison engine evaluates two scenario ids from one baseline. Positive,
negative, and zero deltas are covered by `tests/unit/counterfactual.test.ts`.
The report still cannot reconstruct a sale from a stored shipment, because the
shipment row does not record a scenario id, market, or quality curve. Person 3
remains the owner. Do not close the issue from this documentation change.
