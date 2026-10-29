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
import { PageHeader } from "@/components/ui/PageHeader";
import { databaseConfigured, getPrisma } from "@/lib/db/client";
import {
  evaluateLogisticsPlans,
  findEvaluatedPlan,
} from "@/lib/domain/feasibility";
import { getHarvest } from "@/lib/planning/harvest-store";
import { ReserveView } from "@/components/journey/ReserveView";

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
  searchParams: Promise<{ harvestId?: string; planId?: string; market?: string; kg?: string }>;
}) {
  const { harvestId, planId, market, kg } = await searchParams;
  if (market && !planId) {
    return <ReserveView market={market} kg={kg} />;
  }

  if (!harvestId || !planId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader
          kicker="STEP 3 OF 3 · REQUEST A HOLD"
          title="Request a capacity hold"
          description="Choose a feasible plan from comparison before requesting a capacity hold."
        />
        <p className="text-sm leading-relaxed text-charcoal-600">
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
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader
          kicker="STEP 3 OF 3 · REQUEST A HOLD"
          title="Request a capacity hold"
        />
        <p className="text-sm text-charcoal-600">
          That harvest is not in the local planning store.
        </p>
        <Button href="/harvests/new">Register a harvest</Button>
      </div>
    );
  }

  const evaluation = evaluateLogisticsPlans(harvest);
  const plan = findEvaluatedPlan(evaluation, planId);
  const backHref = `/plans?harvestId=${encodeURIComponent(harvestId)}`;
  const availability = await transportAvailability();

  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader
          kicker="STEP 3 OF 3 · REQUEST A HOLD"
          title="Request a capacity hold"
        />
        <p className="text-sm text-charcoal-600">
          That plan is not part of this harvest evaluation.
        </p>
        <Button href={backHref}>Back to plans</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <Link
          href={backHref}
          className="text-sm font-semibold text-terracotta-700 underline-offset-2 hover:underline"
        >
          Back to plans
        </Link>
        <PageHeader
          kicker="STEP 3 OF 3 · REQUEST A HOLD"
          title="Request a capacity hold"
        />
        <p className="max-w-3xl text-sm leading-relaxed text-charcoal-600">
          Review the selected plan, then ask for a temporary capacity hold. This
          request does not confirm a shipment. Financial figures are modeled
          estimates.
        </p>
      </div>

      {isFeasiblePlan(plan) ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
          <PlanComparisonCard plan={plan} />
          <ReservationHandoff
            planId={plan.planId}
            harvestQuantityKg={harvest.quantityKg}
            availability={availability}
          />
        </div>
      ) : (
        <Card>
          <div className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">
              This plan cannot be reserved
            </h2>
            <p className="text-sm text-charcoal-600">
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

async function transportAvailability() {
  if (!databaseConfigured()) return [];
  const slots = await getPrisma().transportSlot.findMany({
    orderBy: { id: "asc" },
    select: { vehicleType: true, availableKg: true },
  });
  const totals = new Map<string, number>();
  for (const slot of slots) {
    totals.set(
      slot.vehicleType,
      (totals.get(slot.vehicleType) ?? 0) + slot.availableKg
    );
  }
  return [...totals.entries()].map(([vehicleType, availableKg]) => ({
    vehicleType,
    availableKg,
  }));
}
