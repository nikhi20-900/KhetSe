import type { Metadata } from "next";
import { HarvestForm } from "@/components/harvest/HarvestForm";
import { PageTitle, StatusPill, WorkflowStepper } from "@/components/shell/Chrome";
import { cropProfile } from "@/lib/domain/baseline-journey";
import { formatDispatchLabel } from "@/lib/demo/clock";
import { defaultHarvestLocalInput } from "@/lib/planning/schedule";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register your harvest · KhetSe",
  description:
    "Register a farm-gate harvest lot and compare feasible market journeys.",
};

export default function NewHarvestPage() {
  const crop = cropProfile();
  return (
    <div className="space-y-6 pb-8">
      <PageTitle
        title="Register your harvest"
        subtitle="A few details to find a feasible journey."
        aside={<StatusPill tone="green">SIMULATED inputs</StatusPill>}
      />
      <WorkflowStepper current={1} />
      <HarvestForm
        defaultHarvestLocal={defaultHarvestLocalInput()}
        referenceShelfLifeHours={crop.shelfLifeHours}
        bulkDensityKgPerM3={crop.quantityKg / crop.volumeM3}
        dispatchLabel={formatDispatchLabel(crop.dispatchAt)}
      />
    </div>
  );
}
