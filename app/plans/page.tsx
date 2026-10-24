import type { Metadata } from "next";

import { PlanBoard } from "@/components/planning/PlanBoard";
import { Button } from "@/components/ui/Button";
import { evaluateLogisticsPlans } from "@/lib/domain/feasibility";
import { getHarvest } from "@/lib/planning/harvest-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Logistics plans · KhetSe",
  description:
    "Compare feasible harvest logistics plans and read rejection reasons.",
};

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ harvestId?: string }>;
}) {
  const { harvestId } = await searchParams;
  if (!harvestId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Logistics plans</h1>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Record a harvest first. Comparison opens from the lot that was just
          registered.
        </p>
        <Button href="/harvests/new">Record a harvest</Button>
      </div>
    );
  }

  const harvest = getHarvest(harvestId);
  if (!harvest) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Logistics plans</h1>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          No registered harvest matches this id. Record a new lot to compare
          logistics plans.
        </p>
        <Button href="/harvests/new">Record a harvest</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Logistics plans</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Feasible market and transport combinations sit beside the options the
          register rejects. Every cost, transit time, and proceeds figure is a
          modeled estimate.
        </p>
      </div>
      <PlanBoard
        harvestId={harvest.harvestId}
        harvest={harvest}
        evaluation={evaluateLogisticsPlans(harvest)}
      />
    </div>
  );
}
