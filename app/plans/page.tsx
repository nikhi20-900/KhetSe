import type { Metadata } from "next";
import { PlanBoard } from "@/components/planning/PlanBoard";
import { LotSwitcher } from "@/components/planning/LotSwitcher";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { evaluateLogisticsPlans } from "@/lib/domain/feasibility";
import { getHarvest, listHarvests } from "@/lib/planning/harvest-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Logistics Plans · KhetSe Feasibility Engine",
  description:
    "Evaluate feasible multi-modal market and transport combinations for registered harvest lots.",
};

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ harvestId?: string }>;
}) {
  const { harvestId } = await searchParams;
  const allHarvests = listHarvests();

  // If a specific harvestId was requested, use it; otherwise fall back to the latest registered harvest
  const activeHarvestId = harvestId || allHarvests[0]?.harvestId;

  if (!activeHarvestId) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          kicker="MULTI-MODAL PLANNING"
          title="Logistics Plans"
          description="Evaluate feasible APMC market and transport combinations across transit times, logistics tariffs, and net proceeds."
        />
        <EmptyState
          title="No Harvest Lots Registered"
          description="Logistics plan evaluation requires a recorded harvest lot with crop volume, farm-gate coordinates, and quality criteria."
          actionLabel="Record Harvest Intake &rarr;"
          actionHref="/harvests/new"
        />
      </div>
    );
  }

  const harvest = getHarvest(activeHarvestId);
  if (!harvest) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          kicker="MULTI-MODAL PLANNING"
          title="Logistics Plans"
          description="Evaluate feasible APMC market and transport combinations across transit times, logistics tariffs, and net proceeds."
        />
        <EmptyState
          title="Harvest Lot Not Found"
          description={`No registered harvest matches ID "${activeHarvestId}". Choose another registered lot or create a new intake.`}
          actionLabel="Record New Harvest Lot &rarr;"
          actionHref="/harvests/new"
          secondaryActionLabel="Return to Overview"
          secondaryActionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        kicker="MULTI-MODAL FEASIBILITY EVALUATOR"
        title="Logistics Plans &amp; Route Allocation"
        badge={<Badge tone="amber">MODELED ESTIMATES</Badge>}
        description="Feasible market and transport combinations sit beside the options the register rejects. Every cost, transit time, and proceeds figure is a modeled estimate."
        actions={
          <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <LotSwitcher
              activeHarvestId={activeHarvestId}
              harvests={allHarvests}
            />
            <Button
              href="/harvests/new"
              variant="secondary"
              className="text-xs"
            >
              + New Intake
            </Button>
          </div>
        }
      />

      <PlanBoard
        harvestId={harvest.harvestId}
        harvest={harvest}
        evaluation={evaluateLogisticsPlans(harvest)}
      />
    </div>
  );
}
