# Domain Logic, Simulation Engine & Financial Models

## Overview

This directory contains the pure domain logic, mathematical models, state machines, and discrete event simulation rules governing KhetSe.

All business calculations, feasibility scoring, degradation functions, and virtual-clock simulations reside here as pure, deterministic TypeScript modules with zero side-effects.

## Modules & Specifications

- `feasibility.ts`: Pure feasibility checking, physical constraint validation, and multi-objective plan ranking. (Tracked in [Issue #2](https://github.com/nikhi20-900/khetse/issues/2) & [Issue #5](https://github.com/nikhi20-900/khetse/issues/5))
- `booking.ts`: Reservation lifecycle logic, lock duration evaluation, and atomic recovery swap invariants. (Tracked in [Issue #3](https://github.com/nikhi20-900/khetse/issues/3))
- `state-machine.ts`: Formal shipment lifecycle state machine, guard conditions, and event definitions. (Tracked in [Issue #4](https://github.com/nikhi20-900/khetse/issues/4))
- `simulation.ts`: Virtual clock, priority event queue, pseudo-random generator (PRNG), and disruption generators. (Tracked in [Issue #5](https://github.com/nikhi20-900/khetse/issues/5))
- `financials.ts`: Deterministic calculation of gross proceeds, itemized logistics costs, net margins, and salvage values. (Tracked in [Issue #7](https://github.com/nikhi20-900/khetse/issues/7))
- `counterfactual.ts`: Comparative branch evaluation comparing human-approved recovery against no-action baseline under identical seeds and market assumptions. (Tracked in [Issue #7](https://github.com/nikhi20-900/khetse/issues/7))

## Issue #1 baseline handoff

Canonical operational inputs now live in [`data/demo-baseline.json`](../../data/demo-baseline.json),
with provenance in [`data/evidence-register.json`](../../data/evidence-register.json).
Read [`docs/assumptions.md`](../../docs/assumptions.md) for units, timing, capacity,
grade, accounting and comparison rules before implementing domain functions.

The Node scripts under `scripts/` verify these fixtures and generate documentation.
They are not application domain services; keep production calculations as pure
TypeScript here and use integer financial units as specified in `financials.ts`.
The virtual clock is implemented in `simulation.ts`. Persistence integration remains
separate. Run `npm test` for the baseline and simulation regression suites.

## Ownership

- **Primary Owner:** Person 3 — Domain logic, simulation, and QA
- **Collaborator:** Person 2 — Backend and database (for mapping domain entities to Prisma schemas)

## Deterministic transit simulation (issue #5)

Open `/simulation` after `npm run dev` for playback, pause, single-event stepping,
speed selection, reset, and normal/delay/breakdown scenarios. This isolated demo
runs in memory and does not modify reservations or the operational shipment demo.

`Simulation` accepts a canonical route/fleet plan, uint32 seed, tick interval in
hours, optional timed or intermediate-checkpoint disruptions, and an optional
seeded disruption probability. The constructor rechecks feasibility; callers cannot
bypass booking validation by supplying a feasible flag. `evaluateSimulationPlan`
returns machine-readable rejection codes and descriptions for invalid routes,
fleets, quantities, mass or volume capacity. Existing intake ranking remains in
`evaluateLogisticsPlans`; its legacy catalog differs from SIM-001 and must not be
used as simulation input without an explicit adapter.

Time is hours since dispatch, starting at zero. No wall clock, database, random UUID,
or `Math.random` enters the engine. `advanceTo` drains all due events; `step`
processes one. Playback uses `play`, `pause`, `setSpeed` (virtual seconds per supplied
second) and `elapse(seconds)`. Explicit stepping works while paused. The UI advances
in fixed 100 ms playback increments, so background-tab throttling slows playback
without skipping domain events.

Queue order is time, event-type priority, then insertion order. Timed disruptions
precede resumes, checkpoint arrivals, transit ticks, and quality calculations at
the same instant. Checkpoint-triggered disruptions occur just after that arrival.
IDs are reserved on enqueue and stay reserved after dequeue; retries cannot create
another event or side effect. Inputs and returned history are copied. Each history
entry includes its virtual timestamp and quality snapshot.

Disruptions hold remaining travel for their duration. Overlapping timed holds use
their union; any active breakdown selects the stalled-hot profile until it ends.
A delay retains the vehicle environment. Completion means arrival at the final
route node, and freezes the clock and quality. Unloading, market queues, storage
operations, repair costs and settlement are outside this transit engine. In
particular, a route passing a storage node does not automatically perform storage.

Quality uses the canonical SIM-001 curve and environment age multipliers, including
cold/ventilated/ambient/stalled-hot profiles. Temperature is descriptive, not a
new empirical decay formula. Age is computed from environment-change anchors so
playback speed and advance chunk sizes do not introduce integration drift. The
reference shelf-life endpoint is inclusive; rejected lots have zero saleable
fraction. Tests cover seed 42 across 1,000 ticks, replay equivalence, duplicate IDs,
overlapping disruptions, booking rejection, and temperature regimes.
