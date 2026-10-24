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
The virtual clock, API integration and database mutations remain pending their
respective issues. Run `npm test` for the baseline regression suite.

## Ownership

- **Primary Owner:** Person 3 — Domain logic, simulation, and QA
- **Collaborator:** Person 2 — Backend and database (for mapping domain entities to Prisma schemas)
