# KhetSe demonstration walkthrough

**Current status:** the issue #1 data and reference calculations run locally.
Application pages remain placeholders, API routes return 501, and reservations,
virtual-clock playback, human approvals, exports and database resets remain planned.

All operational inputs and results are **SIMULATED**. Use the generated tables in
[assumptions.md](assumptions.md) for the exact scenario inputs and expected outputs.
The earlier scaffold's checkpoint names, prices, decay estimates and claimed
counterfactual amounts are superseded by this canonical baseline.

## Run the available foundation

```sh
npm ci
npm test
npm run demo
```

1. Open [`data/demo-baseline.json`](../data/demo-baseline.json). The lot is Nashik
   Red Onion from Pimpalgaon Baswant, with the crop's initial state defined at dispatch.
2. Review the [evidence register](evidence-register.md). Official references support
   contextual statements only; operational model values are simulated.
3. Run `normal-delivery` to inspect the undisrupted Vashi reference.
4. Compare `vehicle-breakdown`, `alternative-recovery` and `no-action`. Each shares
   the same initial lot, original-truck costs and Nashik failure checkpoint.
5. Inspect `transit-delay`: missing an unloading slot adds overnight queue time,
   detention charges and quality loss.
6. Inspect `negative-recovery`: the four-van fleet and deliberate emergency
   surcharge cost more than the total gross salvage revenue. The comparison must
   show a loss and reject the intervention.

`npm run demo` prints the calculated financial table. It does not create a shipment,
book capacity, approve a recovery or write to a database.

## Planned application walkthrough

These steps are acceptance goals for Issues #2 through #8, not claims that the UI
and API currently perform them.

1. **Harvest intake:** enter the canonical crop, quantity, location, harvest window
   and dispatch condition. Label the values SIMULATED; do not describe the grade
   as a certification or the coordinates as live GPS.
2. **Plan comparison:** display route duration, capacity checks, costs and modeled
   net proceeds. A single reefer van cannot carry the whole lot; fleet capacity
   must be checked by both weight and volume.
3. **Reservation:** reserve the chosen vehicle/storage resources transactionally.
   The backend must map mass capacity and time-based rates explicitly to its schema.
4. **Dispatch:** start the virtual clock at the canonical timestamp and advance
   along the fixed directed edges. The normal reference uses the standard truck.
5. **Disruption:** inject the breakdown on arrival at the Nashik checkpoint and
   freeze the shared pre-decision state for all alternatives.
6. **Recovery options:** compare paid repair, the ventilated-truck route through the
   fictional Nashik cold room to Pune, and the no-action branch. No action waits
   for the carrier's included repair and then continues to Vashi; it is not forced
   abandonment or a fabricated zero-value sale.
7. **Human approval:** require a coordinator's explicit selection before applying
   a recovery. The fixture's recommendation is advisory and performs no booking.
8. **Arrival:** account for intake, storage, conditioned release, onward travel,
   market queuing and unloading, with full itemized costs.
9. **Comparison report:** reproduce the generated expected results in
   [assumptions.md](assumptions.md). Report net modeled proceeds and the delta
   against no action; do not label these amounts farmer profit or guaranteed gain.
10. **Export and reset:** once implemented, export the event and financial records
    and reset to the canonical inputs for repeatable positive and negative cases.

No real-time market data, sensor validation, navigation or measured spoilage
improvement is demonstrated by these fixtures.
