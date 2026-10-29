import type { FeasibleLogisticsPlan } from "@/lib/contracts/plan.contract";
import { MODELED_ESTIMATE_LABEL } from "@/lib/contracts/plan.contract";
import { formatHours, formatInr, formatIst } from "@/lib/planning/format";
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
      <div className="flex h-full flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-charcoal-950 dark:text-linen-50">
            {plan.marketDestination}
          </h3>
          <p className="mt-0.5 text-sm text-charcoal-600 dark:text-linen-400">
            {plan.transportMode} · {plan.receivingWindow}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-lg border border-sage-300 bg-sage-50 p-3 dark:border-sage-700 dark:bg-sage-950/30">
            <dt className="text-sm font-medium text-sage-900 dark:text-sage-200">
              Estimated net return
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-sage-950 dark:text-sage-100">
              {formatInr(plan.breakdown.netProceedsInr)}
            </dd>
          </div>
          <Metric
            label="Delivery cost"
            value={formatInr(plan.breakdown.logisticsTotalInr)}
          />
          <Metric
            label="Modeled transit"
            value={`${formatHours(plan.transitDurationHoursMin)}–${formatHours(plan.transitDurationHoursMax)} hrs`}
          />
          <Metric
            label="Planned departure"
            value={formatIst(plan.scheduledDeparture)}
          />
          <Metric
            label="Planned arrival"
            value={formatIst(plan.scheduledArrival)}
          />
        </dl>

        <p className="text-sm leading-relaxed text-charcoal-600 dark:text-linen-400">
          {MODELED_ESTIMATE_LABEL}. Arrival uses the slower end of the travel
          window so the load can meet the receiving slot.
        </p>
        <CostBreakdownTable breakdown={plan.breakdown} />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-sand-200 bg-sand-50 p-3 dark:border-charcoal-750 dark:bg-charcoal-900/40">
      <dt className="text-xs font-medium text-charcoal-600 dark:text-linen-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-charcoal-950 dark:text-linen-100">
        {value}
      </dd>
    </div>
  );
}
