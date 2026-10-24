import type { Metadata } from "next";
import Link from "next/link";

import { DisruptionAlertBanner } from "@/components/incidents/DisruptionAlertBanner";
import { EventLogList } from "@/components/shipments/EventLogList";
import { InjectBreakdownButton } from "@/components/shipments/InjectBreakdownButton";
import { ResetDemoButton } from "@/components/shipments/ResetDemoButton";
import { ShipmentStatusBadge } from "@/components/shipments/ShipmentStatusBadge";
import { ShipmentTimeline } from "@/components/shipments/ShipmentTimeline";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DEMO_SHIPMENT_ID } from "@/lib/contracts/incident.contract";
import { readOperations } from "@/lib/operations/operations-store";
import { formatKg } from "@/lib/planning/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipment · KhetSe",
  description: "Simulated shipment timeline with disruption alerts.",
};

export default async function ShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id !== DEMO_SHIPMENT_ID) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Shipment</h1>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          This demonstration follows one in-transit load. The full shipment
          lifecycle is still planned.
        </p>
        <Button href={`/shipments/${DEMO_SHIPMENT_ID}`}>
          Open the Igatpuri demonstration
        </Button>
      </div>
    );
  }

  const state = readOperations();
  const shipment = state.shipment;

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Simulated shipment
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {formatKg(shipment.quantityKg)} of {shipment.cropType} from{" "}
            {shipment.originName} toward {shipment.destinationName} on a{" "}
            {shipment.vehicleName}. Positions are modeled checkpoints, not live
            tracking.
          </p>
        </div>
        <ShipmentStatusBadge status={shipment.status} />
      </div>

      {state.incident ? (
        <DisruptionAlertBanner incident={state.incident} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Timeline</h2>
          <ShipmentTimeline events={shipment.events} />
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Incident</h2>
            {state.incident ? (
              <div className="space-y-3 text-sm">
                <p>
                  The breakdown is on the timeline. Recovery still needs a
                  person.
                </p>
                <Link
                  href={`/incidents/${state.incident.id}`}
                  className="font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
                >
                  Open the incident
                </Link>
              </div>
            ) : (
              <InjectBreakdownButton shipmentId={shipment.id} />
            )}
          </Card>
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Decision log</h2>
            <EventLogList entries={state.audit} />
          </Card>
          <ResetDemoButton />
        </div>
      </div>
    </div>
  );
}
