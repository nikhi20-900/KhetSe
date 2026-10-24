# KhetSe demonstration walkthrough

All operational inputs and results are **SIMULATED**. The exact scenario inputs and
expected outputs are the generated tables in [assumptions.md](assumptions.md).
`npm run demo` prints that financial table. It does not create a shipment, book
capacity, or write to a database.

## Run the checks

```sh
npm ci
npm test
npm run type-check
npm run lint
npm run format:check
npm run demo
```

`npm test` includes the baseline scenarios, the reservation and shipment checks,
the recovery swap, and the harvest-to-report flow.

## Run the application

```sh
npm run dev
```

Open `http://localhost:3000`. Reservation, shipment, report, and scenario reset
need `DATABASE_URL` pointing at PostgreSQL, with the Prisma schema applied.
Harvest intake and plan comparison also work from the local planning file.

## Walkthrough

1. **Harvest intake** at `/harvests/new`. The demonstration lot is 10,000 kg of
   Nashik Red Onion from Pimpalgaon Baswant. Grade, coordinates, and the
   shelf-life horizon are simulated inputs, not a certification or a live GPS fix.
2. **Plan comparison** at `/plans?harvestId=...`. Feasible cards and rejected
   cards are both shown. Reefer vans are rejected for this lot because 10,000 kg
   exceeds a 7,500 kg payload and the declared temperature band does not overlap
   the reefer band. Costs and proceeds on these cards are modeled estimates from
   the planning catalog.
3. **Reservation** at `/reservations/new`. The request creates a PostgreSQL hold.
   One storage slot in that database represents 1,000 kg. A conflicting booking
   is refused.
4. **Dispatch.** `POST /api/shipments` with the reservation id records `BOOKED`
   and then `DISPATCHED` when a dispatch time is sent. `POST /api/shipments/{id}/transitions`
   moves the stored shipment through `IN_TRANSIT`. There is no separate dispatch
   screen. The shipment page at `/shipments/demo-igatpuri` is the simulated
   Igatpuri story, not that stored shipment.
5. **Breakdown.** On `/shipments/demo-igatpuri`, inject the simulated breakdown.
   That screen does not change a PostgreSQL reservation until a recovery is
   approved and a reservation id is linked. The stored shipment is marked
   `DISRUPTED` by the breakdown operation used in the integration test.
6. **Recovery.** `/incidents/inc_demo_igatpuri` offers the Nashik demo cold room,
   explains why the Vashi room cannot take 10,000 kg, and always offers no
   action. The Nashik option is priced from the baseline ventilated truck:
   ₹2,800 fixed dispatch plus ₹38/km. Approval requires a named approver, manager
   sign-off when the receiving window changes, and an explicit confirmation.
   If no PostgreSQL reservation is linked, the decision is refused and nothing
   is marked executed.
7. **Report** at `/reports/{shipmentId}`. **Persisted shipment status** is the
   status stored on the shipment, such as `REROUTED` after a confirmed swap.
   The recovery and no-action amounts are a separate modeled comparison from
   `data/demo-baseline.json`. They do not replace that status and they are not
   a completed sale. CSV export uses the same rows.
8. **Reset and replay.** The report page calls `POST /api/scenarios`. Reset
   restores baseline truck and storage capacity and deletes demo shipments,
   reservations, and the local harvest file. Replay does the same and returns
   the reference-model outcome for one scenario id from `data/demo-baseline.json`,
   including `alternative-recovery`, `no-action`, and `negative-recovery`. Replay
   does not create a shipment. An unknown id is rejected.

`/simulation` plays the deterministic transit clock for the normal, breakdown,
and delay cases. Issue #7, the fair recovery-versus-no-action comparison with
positive, zero, and negative deltas, is still Person 3's domain check. The
report currently shows the baseline alternative-recovery and no-action pair only.

No real-time market data, sensor validation, navigation, or measured spoilage
improvement is demonstrated.
