# Plan comparison UI

The planning page is [`app/plans/page.tsx`](../../app/plans/page.tsx). It loads a registered harvest, calls the deterministic planning evaluator, and passes the result to [`PlanBoard`](PlanBoard.tsx). Planning is based on the in-repository catalog and formulas; it does not reserve capacity.

- [`PlanBoard`](PlanBoard.tsx) summarizes harvest details, shows highlighted feasible plans, remaining feasible plans, and rejected candidates.
- [`PlanComparisonCard`](PlanComparisonCard.tsx) displays destination, vehicle, schedule, modeled estimate labels, and cost/proceeds breakdown.
- [`CostBreakdownTable`](CostBreakdownTable.tsx) renders the plan breakdown supplied by the evaluation.
- [`ConstraintRejectionBadge`](ConstraintRejectionBadge.tsx) renders categorized rejection messages.
- [`PlanSelector`](PlanSelector.tsx) links a plan to `/reservations/new` or invokes an optional `onSelect` callback.

The evaluator and response shapes are in [`lib/domain/feasibility.ts`](../../lib/domain/feasibility.ts) and [`lib/contracts/plan.contract.ts`](../../lib/contracts/plan.contract.ts). It evaluates a fixed catalog against intake values, including crop/origin registration, capacity, thermal compatibility, shelf-life and receiving-window constraints. Costs, prices, schedules and proceeds are estimates. The selected-plan handoff can call the PostgreSQL reservation API; selection alone does not book anything. See [`tests/unit/plan-components.test.ts`](../../tests/unit/plan-components.test.ts).
