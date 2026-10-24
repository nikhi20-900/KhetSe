import Link from "next/link";
import type { HarvestIntake } from "@/lib/contracts/harvest.contract";
import type {
  FeasibleLogisticsPlan,
  LogisticsPlanEvaluation,
} from "@/lib/contracts/plan.contract";
import {
  formatIst,
  formatKg,
  formatHours,
  formatInr,
} from "@/lib/planning/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
      {/* Certified Registered Harvest Manifest */}
      <Card
        header={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-linen-300">
                ACTIVE HARVEST MANIFEST
              </span>
              <span className="text-charcoal-400">&bull;</span>
              <span className="break-all font-mono text-2xs text-charcoal-500">
                ID: {harvestId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="green">{harvest.declaredQualityGrade}</Badge>
              <Link
                href="/harvests/new"
                className="text-2xs font-semibold text-terracotta hover:underline"
              >
                Edit Intake &rarr;
              </Link>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-charcoal-900 dark:text-linen-100">
              Registered harvest
            </h2>
            <span className="text-2xs font-mono text-charcoal-500">
              {evaluation.evaluatedCombinations} combinations evaluated
            </span>
          </div>
          <dl className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded bg-sand-50/70 p-2.5 border border-sand-200 dark:bg-charcoal-900/40 dark:border-charcoal-750">
              <dt className="text-2xs uppercase tracking-wider font-mono text-charcoal-500">
                Crop
              </dt>
              <dd className="mt-0.5 font-semibold text-charcoal-900 dark:text-linen-100">
                {harvest.cropType}
              </dd>
            </div>
            <div className="rounded bg-sand-50/70 p-2.5 border border-sand-200 dark:bg-charcoal-900/40 dark:border-charcoal-750">
              <dt className="text-2xs uppercase tracking-wider font-mono text-charcoal-500">
                Volume
              </dt>
              <dd className="mt-0.5 font-semibold font-mono text-charcoal-900 dark:text-linen-100">
                {formatKg(harvest.quantityKg)}
              </dd>
            </div>
            <div className="rounded bg-sand-50/70 p-2.5 border border-sand-200 dark:bg-charcoal-900/40 dark:border-charcoal-750">
              <dt className="text-2xs uppercase tracking-wider font-mono text-charcoal-500">
                Origin
              </dt>
              <dd className="mt-0.5 font-medium text-charcoal-900 dark:text-linen-100 truncate">
                {harvest.originLocation.name}
              </dd>
            </div>
            <div className="rounded bg-sand-50/70 p-2.5 border border-sand-200 dark:bg-charcoal-900/40 dark:border-charcoal-750">
              <dt className="text-2xs uppercase tracking-wider font-mono text-charcoal-500">
                Harvest completion
              </dt>
              <dd className="mt-0.5 font-mono text-charcoal-900 dark:text-linen-100">
                {formatIst(harvest.harvestTimestamp)}
              </dd>
            </div>
            <div className="rounded bg-sand-50/70 p-2.5 border border-sand-200 dark:bg-charcoal-900/40 dark:border-charcoal-750">
              <dt className="text-2xs uppercase tracking-wider font-mono text-charcoal-500">
                Grade
              </dt>
              <dd className="mt-0.5 font-semibold text-charcoal-900 dark:text-linen-100">
                {harvest.declaredQualityGrade}
              </dd>
            </div>
            <div className="rounded bg-sand-50/70 p-2.5 border border-sand-200 dark:bg-charcoal-900/40 dark:border-charcoal-750">
              <dt className="text-2xs uppercase tracking-wider font-mono text-charcoal-500">
                Handling band
              </dt>
              <dd className="mt-0.5 font-mono text-charcoal-900 dark:text-linen-100">
                {harvest.temperatureRequirementC.min}–
                {harvest.temperatureRequirementC.max}°C, shelf-life{" "}
                {harvest.maxShelfLifeHours} h
              </dd>
            </div>
          </dl>
          <div className="pt-2 border-t border-sand-200 dark:border-charcoal-750">
            <p className="text-2xs leading-relaxed text-charcoal-500 dark:text-linen-400">
              {evaluation.evaluatedCombinations} market and vehicle combinations
              were checked. Costs, transit times, and proceeds below are modeled
              estimates. This screen keeps the harvest in a local planning
              store. It does not lock a truck.
            </p>
          </div>
        </div>
      </Card>

      {evaluation.blockingReason ? (
        <section className="space-y-3" aria-labelledby="blocked-heading">
          <h2
            id="blocked-heading"
            className="text-xl font-semibold text-charcoal-950 dark:text-linen-50"
          >
            No plans were priced
          </h2>
          <Card>
            <ConstraintRejectionBadge rejection={evaluation.blockingReason} />
          </Card>
        </section>
      ) : null}

      {/* COMPACT MULTI-MODAL TRADE-OFF MATRIX */}
      {evaluation.feasiblePlans.length > 0 && (
        <section aria-labelledby="matrix-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="matrix-heading"
                className="text-base font-bold text-charcoal-950 dark:text-linen-50"
              >
                Multi-Modal Trade-off Matrix
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-linen-400">
                Side-by-side comparison of transit duration, total logistics
                deduction, and modeled net returns.
              </p>
            </div>
            <Badge tone="amber">All amounts modeled estimates</Badge>
          </div>

          <Card>
            <div className="overflow-x-auto -mx-5 -my-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-sand-300 dark:border-charcoal-750 bg-sand-50/80 dark:bg-charcoal-900/80 text-charcoal-600 dark:text-linen-300 font-mono text-2xs uppercase tracking-wider">
                    <th scope="col" className="py-2.5 px-4">
                      Market Destination
                    </th>
                    <th scope="col" className="py-2.5 px-4">
                      Transport Mode
                    </th>
                    <th scope="col" className="py-2.5 px-4">
                      Objective Profile
                    </th>
                    <th scope="col" className="py-2.5 px-4">
                      Transit Window
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-right">
                      Logistics Total
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-right">
                      Est. Net Return
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200 dark:divide-charcoal-750">
                  {evaluation.feasiblePlans.map((plan) => {
                    const isMax = plan.objectiveLabels.includes(
                      "Maximum Estimated Proceeds"
                    );
                    return (
                      <tr
                        key={plan.planId}
                        className={`hover:bg-sand-50/60 dark:hover:bg-charcoal-800/40 transition-colors ${
                          isMax
                            ? "bg-terracotta-50/20 dark:bg-terracotta-950/10"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-charcoal-900 dark:text-linen-100">
                          {plan.marketDestination}
                        </td>
                        <td className="py-3 px-4 font-mono text-charcoal-700 dark:text-linen-300">
                          {plan.transportMode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {plan.objectiveLabels.map((lbl) => (
                              <Badge
                                key={lbl}
                                tone={
                                  lbl === "Maximum Estimated Proceeds"
                                    ? "terracotta"
                                    : "sage"
                                }
                              >
                                {lbl}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-2xs text-charcoal-600 dark:text-linen-400">
                          {formatHours(plan.transitDurationHoursMin)}–
                          {formatHours(plan.transitDurationHoursMax)} hrs
                          <div className="text-2xs text-charcoal-400">
                            {plan.receivingWindow}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-charcoal-900 dark:text-linen-100">
                          {formatInr(plan.breakdown.logisticsTotalInr)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sage-900 dark:text-sage-200">
                          {formatInr(plan.breakdown.netProceedsInr)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            href={`/reservations/new?harvestId=${encodeURIComponent(harvestId)}&planId=${encodeURIComponent(plan.planId)}`}
                            variant={isMax ? "primary" : "secondary"}
                            className="text-xs py-1 px-2.5 font-medium"
                          >
                            Reserve &rarr;
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {/* FEATURED PLANS SECTION */}
      {featuredPlans.length > 0 ? (
        <section className="space-y-4" aria-labelledby="featured-heading">
          <div className="space-y-1">
            <h2
              id="featured-heading"
              className="text-lg font-bold text-charcoal-950 dark:text-linen-50"
            >
              Plans to compare
            </h2>
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-charcoal-600 dark:text-linen-400">
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

      {/* OTHER FEASIBLE PLANS */}
      {otherPlans.length > 0 ? (
        <section className="space-y-4" aria-labelledby="other-heading">
          <h2
            id="other-heading"
            className="text-lg font-bold text-charcoal-950 dark:text-linen-50"
          >
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
        <p className="text-sm text-charcoal-700 dark:text-linen-300">
          No feasible plan fits this harvest. The rejected options below name
          the constraint that blocked them.
        </p>
      ) : null}

      {/* REJECTED OPTIONS SECTION */}
      {!evaluation.blockingReason && evaluation.rejectedPlans.length > 0 ? (
        <section
          className="space-y-4 pt-4 border-t border-sand-300 dark:border-charcoal-700"
          aria-labelledby="rejected-heading"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-red-500"
                aria-hidden="true"
              />
              <h2
                id="rejected-heading"
                className="text-lg font-bold text-charcoal-950 dark:text-linen-50"
              >
                Rejected options
              </h2>
            </div>
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-charcoal-600 dark:text-linen-400">
              Infeasible combinations stay visible. Each one names the
              constraint that failed.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {evaluation.rejectedPlans.map((plan) => (
              <Card key={plan.planId}>
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between border-b border-sand-200 dark:border-charcoal-750 pb-2">
                    <div>
                      <h3 className="font-semibold text-charcoal-900 dark:text-linen-100 text-sm">
                        {plan.marketDestination}
                      </h3>
                      <p className="text-xs font-mono text-charcoal-500 dark:text-linen-400">
                        {plan.transportMode}
                      </p>
                    </div>
                    <Badge tone="red">Rejected</Badge>
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
