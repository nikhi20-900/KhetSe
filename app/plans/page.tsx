import type { Metadata } from "next";
import { PlanBoard } from "@/components/planning/PlanBoard";
import { PlanDeck } from "@/components/journey/PlanDeck";
import { PageTitle, StatusPill, WorkflowStepper } from "@/components/shell/Chrome";
import { evaluateLogisticsPlans } from "@/lib/domain/feasibility";
import {
  cropProfile,
  directMarketPlans,
} from "@/lib/domain/baseline-journey";
import { getHarvest, listHarvests } from "@/lib/planning/harvest-store";
import { formatKg } from "@/lib/planning/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a logistics plan · KhetSe",
  description:
    "Compare feasible market journeys for a registered harvest lot.",
};

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ harvestId?: string }>;
}) {
  const { harvestId } = await searchParams;
  const harvests = listHarvests();
  const activeId = harvestId || harvests[0]?.harvestId;
  const harvest = activeId ? getHarvest(activeId) : undefined;
  const crop = cropProfile();
  const evaluation = harvest ? evaluateLogisticsPlans(harvest) : null;
  const blocked = Boolean(evaluation?.blockingReason);
  const quantityKg = harvest && !blocked ? harvest.quantityKg : crop.quantityKg;
  const shelfLife = harvest && !blocked ? harvest.maxShelfLifeHours : undefined;
  const model = blocked ? null : directMarketPlans(quantityKg, shelfLife);

  return (
    <div className="space-y-6 pb-8">
      <PageTitle
        title="Choose a logistics plan"
        subtitle={`Compare complete journeys for your ${formatKg(quantityKg)} harvest.`}
        aside={
          model ? (
            <StatusPill tone="green">{model.plans.length} feasible plans</StatusPill>
          ) : (
            <StatusPill tone="amber">Needs another lot</StatusPill>
          )
        }
      />
      <WorkflowStepper current={2} />

      {blocked && harvest && evaluation ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-[#ead9a4] bg-khet-cream px-4 py-3 text-sm">
            {evaluation.blockingReason?.message} The canonical market cards stay
            hidden until this lot matches the registered onion profile.
          </p>
          <PlanBoard
            harvestId={harvest.harvestId}
            harvest={harvest}
            evaluation={evaluation}
          />
        </div>
      ) : null}

      {model?.blocked ? (
        <p
          role="status"
          className="rounded-xl border border-khet-roseLine bg-khet-rose px-4 py-3 text-sm text-khet-roseInk"
        >
          {model.blocked.message}
        </p>
      ) : null}

      {model && model.plans.length > 0 ? (
        <PlanDeck
          plans={model.plans}
          reefer={model.reefer}
          quantityKg={quantityKg}
        />
      ) : null}

      {harvest && evaluation && !blocked ? (
        <details className="rounded-2xl border border-khet-line p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Intake catalog for this harvest
          </summary>
          <p className="mt-2 text-sm text-khet-muted">
            Separate register from the canonical baseline. Distances and prices
            are not the cards above.
          </p>
          <div className="mt-4">
            <PlanBoard
              harvestId={harvest.harvestId}
              harvest={harvest}
              evaluation={evaluation}
            />
          </div>
        </details>
      ) : null}

      {!harvest ? (
        <p className="text-sm text-khet-muted">
          These cards use the canonical 10,000 kg demo lot. Register a harvest
          to apply a different quantity.
        </p>
      ) : null}
    </div>
  );
}
