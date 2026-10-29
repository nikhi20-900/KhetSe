import Link from "next/link";
import type { HarvestIntake } from "@/lib/contracts/harvest.contract";
import type {
  FeasibleLogisticsPlan,
  LogisticsPlanEvaluation,
} from "@/lib/contracts/plan.contract";
import { formatIst, formatKg } from "@/lib/planning/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
  const reserveHref = (planId: string) =>
    `/reservations/new?harvestId=${encodeURIComponent(harvestId)}&planId=${encodeURIComponent(planId)}`;

  return (
    <div className="space-y-8">
      <Card
        header={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-charcoal-900 dark:text-linen-100">
                Current harvest
              </p>
              <p className="mt-0.5 break-all text-xs text-charcoal-600 dark:text-linen-400">
                Lot ID: {harvestId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="sage">{harvest.declaredQualityGrade}</Badge>
              <Link
                href="/harvests/new"
                className="rounded-sm text-sm font-semibold text-terracotta-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
              >
                Edit intake
              </Link>
            </div>
          </div>
        }
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HarvestDetail label="Crop" value={harvest.cropType} />
          <HarvestDetail
            label="Harvest volume"
            value={formatKg(harvest.quantityKg)}
          />
          <HarvestDetail label="Origin" value={harvest.originLocation.name} />
          <HarvestDetail
            label="Harvest completed"
            value={formatIst(harvest.harvestTimestamp)}
          />
          <HarvestDetail
            label="Temperature range"
            value={`${harvest.temperatureRequirementC.min}–${harvest.temperatureRequirementC.max}°C`}
          />
          <HarvestDetail
            label="Shelf life"
            value={`${harvest.maxShelfLifeHours} hours`}
          />
        </dl>
        <p className="mt-4 border-t border-sand-200 pt-3 text-sm leading-relaxed text-charcoal-600 dark:border-charcoal-750 dark:text-linen-400">
          {evaluation.evaluatedCombinations} market and transport options were
          compared. Costs, travel times, and expected proceeds are estimates for
          this demo. Choosing a plan does not book a vehicle.
        </p>
      </Card>

      {evaluation.blockingReason ? (
        <section className="space-y-3" aria-labelledby="blocked-heading">
          <h2
            id="blocked-heading"
            className="text-xl font-semibold text-charcoal-950 dark:text-linen-50"
          >
            We could not price a plan
          </h2>
          <Card>
            <ConstraintRejectionBadge rejection={evaluation.blockingReason} />
          </Card>
        </section>
      ) : null}

      {featuredPlans.length > 0 ? (
        <section className="space-y-4" aria-labelledby="featured-heading">
          <div className="space-y-1">
            <h2
              id="featured-heading"
              className="text-xl font-semibold text-charcoal-950 dark:text-linen-50"
            >
              Compare your options
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-charcoal-600 dark:text-linen-400">
              Highlighted cards are the fastest transit, the lowest logistics
              cost, and the highest modeled net proceeds. Their per-kilometre
              rates come from the planning catalog. A ventilated card uses
              ₹72/km. The recovery and no-action comparison uses the baseline
              vehicle register instead, where that truck is ₹38/km. Transit
              windows are published per market, so the fastest card prefers the
              ventilated truck when two vehicles share that window.
            </p>
          </div>
          <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {featuredPlans.map((plan) => (
              <PlanComparisonCard
                key={plan.planId}
                plan={plan}
                reserveHref={reserveHref(plan.planId)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {otherPlans.length > 0 ? (
        <section className="space-y-4" aria-labelledby="other-heading">
          <h2
            id="other-heading"
            className="text-xl font-semibold text-charcoal-950 dark:text-linen-50"
          >
            More options
          </h2>
          <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {otherPlans.map((plan) => (
              <PlanComparisonCard
                key={plan.planId}
                plan={plan}
                reserveHref={reserveHref(plan.planId)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {evaluation.feasiblePlans.length === 0 && !evaluation.blockingReason ? (
        <p className="text-sm text-charcoal-700 dark:text-linen-300">
          No plan fits this harvest. The options below explain what prevented a
          match.
        </p>
      ) : null}

      {!evaluation.blockingReason && evaluation.rejectedPlans.length > 0 ? (
        <section
          className="space-y-4 border-t border-sand-300 pt-5 dark:border-charcoal-700"
          aria-labelledby="rejected-heading"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-red-600"
                aria-hidden="true"
              />
              <h2
                id="rejected-heading"
                className="text-xl font-semibold text-charcoal-950 dark:text-linen-50"
              >
                Options that do not fit
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-charcoal-600 dark:text-linen-400">
              Each option names the requirement it could not meet.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {evaluation.rejectedPlans.map((plan) => (
              <Card key={plan.planId}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-sand-200 pb-2 dark:border-charcoal-750">
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal-900 dark:text-linen-100">
                        {plan.marketDestination}
                      </h3>
                      <p className="mt-0.5 text-sm text-charcoal-600 dark:text-linen-400">
                        {plan.transportMode}
                      </p>
                    </div>
                    <Badge tone="red">Unavailable</Badge>
                  </div>
                  <div className="space-y-2">
                    {plan.rejections.map((item) => (
                      <ConstraintRejectionBadge
                        key={item.code}
                        rejection={item}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function HarvestDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-sand-200 bg-sand-50 p-3 dark:border-charcoal-750 dark:bg-charcoal-900/40">
      <dt className="text-xs font-medium text-charcoal-600 dark:text-linen-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-charcoal-950 dark:text-linen-100">
        {value}
      </dd>
    </div>
  );
}
