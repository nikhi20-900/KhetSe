import type { Metadata } from "next";
import Link from "next/link";

import type {
  FeasibleLogisticsPlan,
  RejectedLogisticsPlan,
} from "@/lib/contracts/plan.contract";
import { ConstraintRejectionBadge } from "@/components/planning/ConstraintRejectionBadge";
import { PlanComparisonCard } from "@/components/planning/PlanComparisonCard";
import { ReservationHandoff } from "@/components/reservations/ReservationHandoff";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  evaluateLogisticsPlans,
  findEvaluatedPlan,
} from "@/lib/domain/feasibility";
import { getHarvest } from "@/lib/planning/harvest-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Capacity reservation · KhetSe",
  description:
    "Continue a selected logistics plan into the capacity reservation handoff.",
};

function isFeasiblePlan(
  plan: FeasibleLogisticsPlan | RejectedLogisticsPlan
): plan is FeasibleLogisticsPlan {
  return plan.feasibility.isFeasible;
}

export default async function ReservationHandoffPage({
  searchParams,
}: {
  searchParams: Promise<{ harvestId?: string; planId?: string }>;
}) {
  const { harvestId, planId } = await searchParams;

  if (!harvestId || !planId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Capacity reservation
        </h1>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Choose a feasible plan from comparison. The booking handoff needs both
          a harvest and a plan.
        </p>
        <Button href="/harvests/new">Start harvest intake</Button>
      </div>
    );
  }

  const harvest = getHarvest(harvestId);
  if (!harvest) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Capacity reservation
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          That harvest is not in the local planning store.
        </p>
        <Button href="/harvests/new">Register a harvest</Button>
      </div>
    );
  }

  const evaluation = evaluateLogisticsPlans(harvest);
  const plan = findEvaluatedPlan(evaluation, planId);
  const backHref = `/plans?harvestId=${encodeURIComponent(harvestId)}`;

  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Capacity reservation
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          That plan is not part of this harvest evaluation.
        </p>
        <Button href={backHref}>Back to plans</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="space-y-2">
        <Link
          href={backHref}
          className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
        >
          Back to plans
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Capacity reservation
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          The selected plan is ready for a capacity hold. Financial figures on
          the card remain modeled estimates.
        </p>
      </div>

      {isFeasiblePlan(plan) ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
          <PlanComparisonCard plan={plan} />
          <ReservationHandoff
            planId={plan.planId}
            harvestQuantityKg={harvest.quantityKg}
          />
        </div>
      ) : (
        <Card>
          <div className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">
              This plan cannot be reserved
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {plan.marketDestination} · {plan.transportMode}
            </p>
            {plan.rejections.map((item) => (
              <ConstraintRejectionBadge key={item.code} rejection={item} />
            ))}
            <Button href={backHref} variant="secondary">
              Choose another plan
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
