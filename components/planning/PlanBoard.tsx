import type { HarvestIntake } from "@/lib/contracts/harvest.contract";
import type {
  FeasibleLogisticsPlan,
  LogisticsPlanEvaluation,
} from "@/lib/contracts/plan.contract";
import { formatIst, formatKg } from "@/lib/planning/format";
import { Card } from "@/components/ui/Card";

import { ConstraintRejectionBadge } from "./ConstraintRejectionBadge";
import { PlanComparisonCard } from "./PlanComparisonCard";

export function PlanBoard({
  harvestId,
  harvest,
  evaluation,
}: {
  harvestId: string;
  harvest: HarvestIntake;
  evaluation: LogisticsPlanEvaluation;
}) {
  const featured = new Set(evaluation.featuredPlanIds);
  const featuredPlans = evaluation.featuredPlanIds
    .map((planId) =>
      evaluation.feasiblePlans.find((plan) => plan.planId === planId)
    )
    .filter((plan): plan is FeasibleLogisticsPlan => plan !== undefined);
  const otherPlans = evaluation.feasiblePlans.filter(
    (plan) => !featured.has(plan.planId)
  );

  return (
    <div className="space-y-8">
      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Registered harvest
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Crop
              </dt>
              <dd>{harvest.cropType}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Volume
              </dt>
              <dd>{formatKg(harvest.quantityKg)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Origin
              </dt>
              <dd>{harvest.originLocation.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Harvest completion
              </dt>
              <dd>{formatIst(harvest.harvestTimestamp)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Grade
              </dt>
              <dd>{harvest.declaredQualityGrade}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Handling band
              </dt>
              <dd>
                {harvest.temperatureRequirementC.min}–
                {harvest.temperatureRequirementC.max}°C, shelf-life{" "}
                {harvest.maxShelfLifeHours} h
              </dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {evaluation.evaluatedCombinations} market and vehicle combinations
            were checked. Costs, transit times, and proceeds below are modeled
            estimates. This screen keeps the harvest in a local planning store.
            It does not lock a truck.
          </p>
        </div>
      </Card>

      {evaluation.blockingReason ? (
        <section className="space-y-3" aria-labelledby="blocked-heading">
          <h2 id="blocked-heading" className="text-xl font-semibold">
            No plans were priced
          </h2>
          <Card>
            <ConstraintRejectionBadge rejection={evaluation.blockingReason} />
          </Card>
        </section>
      ) : null}

      {featuredPlans.length > 0 ? (
        <section className="space-y-4" aria-labelledby="featured-heading">
          <div className="space-y-2">
            <h2 id="featured-heading" className="text-xl font-semibold">
              Plans to compare
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Highlighted cards are the fastest transit, the lowest logistics
              cost, and the highest modeled net proceeds. Transit windows are
              published per market, so the fastest card prefers the ventilated
              truck when two vehicles share that window.
            </p>
          </div>
          <div className="grid items-stretch gap-4 xl:grid-cols-3">
            {featuredPlans.map((plan) => (
              <PlanComparisonCard
                key={plan.planId}
                plan={plan}
                reserveHref={`/reservations/new?harvestId=${encodeURIComponent(harvestId)}&planId=${encodeURIComponent(plan.planId)}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {otherPlans.length > 0 ? (
        <section className="space-y-4" aria-labelledby="other-heading">
          <h2 id="other-heading" className="text-xl font-semibold">
            Other feasible plans
          </h2>
          <div className="grid items-stretch gap-4 xl:grid-cols-3">
            {otherPlans.map((plan) => (
              <PlanComparisonCard
                key={plan.planId}
                plan={plan}
                reserveHref={`/reservations/new?harvestId=${encodeURIComponent(harvestId)}&planId=${encodeURIComponent(plan.planId)}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {evaluation.feasiblePlans.length === 0 && !evaluation.blockingReason ? (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          No feasible plan fits this harvest. The rejected options below name
          the constraint that blocked them.
        </p>
      ) : null}

      {!evaluation.blockingReason && evaluation.rejectedPlans.length > 0 ? (
        <section className="space-y-4" aria-labelledby="rejected-heading">
          <div className="space-y-2">
            <h2 id="rejected-heading" className="text-xl font-semibold">
              Rejected options
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Infeasible combinations stay visible. Each one names the
              constraint that failed.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {evaluation.rejectedPlans.map((plan) => (
              <Card key={plan.planId}>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {plan.marketDestination}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.transportMode}
                    </p>
                  </div>
                  {plan.rejections.map((item) => (
                    <ConstraintRejectionBadge
                      key={item.code}
                      rejection={item}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
