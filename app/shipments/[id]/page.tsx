import type { Metadata } from "next";

import { DisruptionAlertBanner } from "@/components/incidents/DisruptionAlertBanner";
import { EventLogList } from "@/components/shipments/EventLogList";
import { InjectBreakdownButton } from "@/components/shipments/InjectBreakdownButton";
import { ResetDemoButton } from "@/components/shipments/ResetDemoButton";
import { ShipmentStatusBadge } from "@/components/shipments/ShipmentStatusBadge";
import { ShipmentTimeline } from "@/components/shipments/ShipmentTimeline";
import { StoredShipmentRecord } from "@/components/shipments/StoredShipmentRecord";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEMO_SHIPMENT_ID } from "@/lib/contracts/incident.contract";
import { readOperations } from "@/lib/operations/operations-store";
import { formatIst, formatKg } from "@/lib/planning/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipment · KhetSe",
  description: "Shipment milestones for the KhetSe demonstration scenario.",
};

export default async function ShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id !== DEMO_SHIPMENT_ID) {
    return <StoredShipmentRecord id={id} />;
  }

  const state = readOperations();
  const shipment = state.shipment;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        kicker="SHIPMENT RECORD · SIMULATED SCENARIO"
        title={shipment.id}
        description={`${formatKg(shipment.quantityKg)} of ${shipment.cropType} · ${shipment.originName} to ${shipment.destinationName} · ${shipment.vehicleName}. Milestones are scenario records, not live location updates.`}
        badge={<Badge tone="gray">DEMO</Badge>}
        actions={<ShipmentStatusBadge status={shipment.status} />}
      />

      {state.incident ? (
        <DisruptionAlertBanner incident={state.incident} />
      ) : null}

      <section
        aria-label="Shipment details"
        className="grid gap-x-6 gap-y-4 border-y border-sand-300 py-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Data
          label="Harvest recorded"
          value={formatIst(shipment.harvestTimestamp)}
        />
        <Data label="Dispatched" value={formatIst(shipment.dispatchedAt)} />
        <Data label="Receiving window" value={shipment.receivingWindow} />
        <Data
          label="Declared shelf horizon"
          value={`${shipment.maxShelfLifeHours} hours`}
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
        <Card
          header={
            <h2 className="font-semibold text-charcoal-950">
              Shipment milestones
            </h2>
          }
        >
          <ShipmentTimeline events={shipment.events} />
        </Card>
        <aside className="space-y-4">
          <Card
            header={
              <h2 className="font-semibold text-charcoal-950">
                Scenario actions
              </h2>
            }
          >
            <div className="space-y-3 text-sm text-charcoal-700">
              <p>
                Scenario changes are local to this demonstration. Recovery
                decisions require a person to review and confirm them.
              </p>
              {state.incident ? (
                <Button
                  href={`/incidents/${state.incident.id}`}
                  variant="secondary"
                >
                  Open incident record
                </Button>
              ) : (
                <InjectBreakdownButton shipmentId={shipment.id} />
              )}
              <div className="border-t border-sand-200 pt-3">
                <ResetDemoButton />
              </div>
            </div>
          </Card>
          <Card
            header={
              <h2 className="font-semibold text-charcoal-950">Decision log</h2>
            }
          >
            <EventLogList entries={state.audit} />
          </Card>
          <Button
            href={`/reports/${shipment.id}`}
            variant="secondary"
            className="w-full"
          >
            Open shipment report
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-charcoal-500">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-charcoal-900">
        {value}
      </div>
    </div>
  );
}
