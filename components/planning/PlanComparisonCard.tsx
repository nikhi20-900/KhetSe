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

  return (
    <Card
      className="flex h-full flex-col"
      header={
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {plan.objectiveLabels.length > 0 ? (
              plan.objectiveLabels.map((objective) => (
                <Badge key={objective} tone="green">
                  {objective}
                </Badge>
              ))
            ) : (
              <Badge tone="gray">Feasible</Badge>
            )}
            <Badge tone="amber">{plan.estimateLabel}</Badge>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
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
      <div className="flex h-full flex-col gap-4">
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {plan.marketDestination}
          </p>
          <p>{plan.transportMode}</p>
          <p>Receiving window {plan.receivingWindow}</p>
          <p>
            <span className="font-semibold">Modeled transit: </span>
            {formatHours(plan.transitDurationHoursMin)}–
            {formatHours(plan.transitDurationHoursMax)} hours
          </p>
          <p>Depart {formatIst(plan.scheduledDeparture)}</p>
          <p>Arrive {formatIst(plan.scheduledArrival)}</p>
          <p className="text-xs text-amber-900 dark:text-amber-200">
            {`${MODELED_ESTIMATE_LABEL}. Arrival is scheduled on the slow end of the documented transit window so the load can still meet the receiving slot.`}
          </p>
        </div>
        <CostBreakdownTable breakdown={plan.breakdown} />
      </div>
    </Card>
  );
}
