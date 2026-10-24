import type { Metadata } from "next";
import Link from "next/link";

import { DisruptionAlertBanner } from "@/components/incidents/DisruptionAlertBanner";
import { HumanApprovalModal } from "@/components/incidents/HumanApprovalModal";
import { NoActionCard } from "@/components/incidents/NoActionCard";
import { RecoveryOptionCard } from "@/components/incidents/RecoveryOptionCard";
import { EventLogList } from "@/components/shipments/EventLogList";
import { Button } from "@/components/ui/Button";
import {
  DEMO_INCIDENT_ID,
  DEMO_SHIPMENT_ID,
} from "@/lib/contracts/incident.contract";
import { readOperations } from "@/lib/operations/operations-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incident · KhetSe",
  description: "Simulated disruption alert and human-approved recovery.",
};

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = readOperations();
  const incident = state.incident;

  if (!incident || incident.id !== id) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Disruption alert</h1>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          No breakdown has been injected for this id. Open the demonstration
          shipment and inject the Igatpuri checkpoint incident.
        </p>
        <Button href={`/shipments/${DEMO_SHIPMENT_ID}`}>
          Open the demonstration shipment
        </Button>
        {id !== DEMO_INCIDENT_ID ? (
          <p className="text-xs text-gray-500">
            The demonstration incident id is {DEMO_INCIDENT_ID}.
          </p>
        ) : null}
      </div>
    );
  }

  const storageOptions = incident.options.filter(
    (option) => option.kind === "STORAGE_REROUTE"
  );
  const noAction = incident.options.find(
    (option) => option.kind === "NO_ACTION"
  );

  return (
    <div className="space-y-6 py-8">
      <Link
        href={`/shipments/${incident.shipmentId}`}
        className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
      >
        Back to the shipment timeline
      </Link>
      <DisruptionAlertBanner incident={incident} />
      <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        Recovery is not applied by opening this page. A person has to choose an
        option, including no action, and confirm it. If the cold store cannot
        take the load at that moment, the truck booking stays as it is.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {storageOptions.map((option) => (
          <RecoveryOptionCard key={option.id} option={option} />
        ))}
      </div>
      {noAction ? <NoActionCard option={noAction} /> : null}

      {incident.status === "OPEN" ? (
        <HumanApprovalModal
          incidentId={incident.id}
          options={incident.options}
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recorded decision</h2>
          <EventLogList entries={state.audit} />
        </section>
      )}
    </div>
  );
}
