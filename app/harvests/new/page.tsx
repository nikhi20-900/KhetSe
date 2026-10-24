import type { Metadata } from "next";

import { HarvestForm } from "@/components/harvest/HarvestForm";
import { defaultHarvestLocalInput } from "@/lib/planning/schedule";
import { PageHeader } from "@/components/ui/PageHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Harvest Intake · KhetSe Agricultural Logistics",
  description:
    "Register a farm-gate harvest lot and evaluate multi-modal logistics feasibility and APMC allocation.",
};

export default function NewHarvestPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        kicker="FARM-GATE INTAKE MANIFEST"
        title="Harvest intake register"
        badge={<Badge tone="gray">DEMO LOT PREFILLED</Badge>}
        description="Record crop, volume, harvest time, origin, grade, and handling requirements before comparing logistics plans."
      />

      <AlertBanner tone="modeled" title="Synthetic demonstration lot">
        The form starts with a 10,000 kg Nashik Red Onion example. Its
        assumptions are demonstration inputs, not verified field measurements.
        You can edit the values before continuing to plan comparison.
      </AlertBanner>

      <HarvestForm defaultHarvestLocal={defaultHarvestLocalInput()} />
    </div>
  );
}
