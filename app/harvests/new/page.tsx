import type { Metadata } from "next";

import { HarvestForm } from "@/components/harvest/HarvestForm";
import { defaultHarvestLocalInput } from "@/lib/planning/schedule";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Harvest intake · KhetSe",
  description:
    "Register a harvest batch and continue to logistics plan comparison.",
};

export default function NewHarvestPage() {
  return (
    <div className="space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Harvest intake</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Record the lot before comparing logistics plans. The demonstration lot
          is Nashik Red Onion from Pimpalgaon Baswant. Costs and transit times
          on the next screen are modeled estimates.
        </p>
      </div>
      <HarvestForm defaultHarvestLocal={defaultHarvestLocalInput()} />
    </div>
  );
}
