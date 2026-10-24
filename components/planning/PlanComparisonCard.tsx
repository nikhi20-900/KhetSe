import type { FeasibleLogisticsPlan } from "@/lib/contracts/plan.contract";
import { MODELED_ESTIMATE_LABEL } from "@/lib/contracts/plan.contract";
import { formatHours, formatIst } from "@/lib/planning/format";
import { CostBreakdownTable } from "@/components/planning/CostBreakdownTable";
import { PlanSelector } from "@/components/planning/PlanSelector";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function PlanComparisonCard({
  plan,
  onSelect,
  reserveHref,
}: {
  plan: FeasibleLogisticsPlan;
  onSelect?: (planId: string) => void;
  reserveHref?: string;
}) {
  const heading =
    plan.objectiveLabels.length > 0
      ? plan.objectiveLabels.join(" · ")
      : "Feasible plan";

  const isFastest = plan.objectiveLabels.includes("Fastest Transit");
  const isLowestCost = plan.objectiveLabels.includes("Lowest Cost");
  const isMaxProceeds = plan.objectiveLabels.includes(
    "Maximum Estimated Proceeds"
  );

  return (
    <Card
      className={`flex h-full flex-col transition-all ${
        isMaxProceeds
          ? "border-terracotta/70 shadow-sm dark:border-terracotta-600"
          : isFastest || isLowestCost
            ? "border-sage-400 dark:border-sage-700"
            : ""
      }`}
      header={
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              {plan.objectiveLabels.length > 0 ? (
                plan.objectiveLabels.map((objective) => (
                  <Badge
                    key={objective}
                    tone={
                      objective === "Maximum Estimated Proceeds"
                        ? "terracotta"
                        : "sage"
                    }
                  >
                    {objective}
                  </Badge>
                ))
              ) : (
                <Badge tone="gray">Feasible</Badge>
              )}
            </div>
            <Badge tone="amber">{plan.estimateLabel}</Badge>
          </div>
          <h2 className="text-base font-bold text-charcoal-950 dark:text-linen-50">
            {heading}
          </h2>
        </div>
      }
      footer={
        reserveHref ? (
          <PlanSelector href={reserveHref} />
        ) : onSelect ? (
          <PlanSelector planId={plan.planId} onSelect={onSelect} />
        ) : null
      }
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="space-y-2 text-xs text-charcoal-700 dark:text-linen-300">
          <div className="rounded bg-sand-100/60 p-3 dark:bg-charcoal-900/40 border border-sand-200 dark:border-charcoal-750 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-charcoal-950 dark:text-linen-50 text-sm">
                {plan.marketDestination}
              </span>
              <span className="font-mono text-2xs text-charcoal-500 uppercase">
                {plan.transportMode}
              </span>
            </div>
            <div className="flex items-center justify-between text-2xs font-mono text-charcoal-600 dark:text-linen-400 pt-1 border-t border-sand-200/60 dark:border-charcoal-750">
              <span>Slot: {plan.receivingWindow}</span>
              <span>
                <span className="font-semibold">Modeled transit: </span>
                {formatHours(plan.transitDurationHoursMin)}–
                {formatHours(plan.transitDurationHoursMax)} hours
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
            <div className="p-2 rounded bg-sand-50/50 dark:bg-charcoal-900/30 border border-sand-200 dark:border-charcoal-800">
              <span className="text-charcoal-500 block">Depart</span>
              <span className="font-semibold text-charcoal-900 dark:text-linen-100">
                {formatIst(plan.scheduledDeparture)}
              </span>
            </div>
            <div className="p-2 rounded bg-sand-50/50 dark:bg-charcoal-900/30 border border-sand-200 dark:border-charcoal-800">
              <span className="text-charcoal-500 block">Arrive</span>
              <span className="font-semibold text-charcoal-900 dark:text-linen-100">
                {formatIst(plan.scheduledArrival)}
              </span>
            </div>
          </div>

          <p className="text-2xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
            {`${MODELED_ESTIMATE_LABEL}. Arrival is scheduled on the slow end of the documented transit window so the load can still meet the receiving slot.`}
          </p>
        </div>

        <CostBreakdownTable breakdown={plan.breakdown} />
      </div>
    </Card>
  );
}
