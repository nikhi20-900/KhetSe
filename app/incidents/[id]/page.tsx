import type { Metadata } from "next";
import Link from "next/link";

import { DisruptionAlertBanner } from "@/components/incidents/DisruptionAlertBanner";
import { HumanApprovalModal } from "@/components/incidents/HumanApprovalModal";
import { NoActionCard } from "@/components/incidents/NoActionCard";
import { RecoveryOptionCard } from "@/components/incidents/RecoveryOptionCard";
import { EventLogList } from "@/components/shipments/EventLogList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DEMO_INCIDENT_ID,
  DEMO_SHIPMENT_ID,
} from "@/lib/contracts/incident.contract";
import { readOperations } from "@/lib/operations/operations-store";
import { CANONICAL_SHIPMENT_ID } from "@/lib/demo/constants";
import {
  ApprovalScreen,
  RecoveryChooser,
} from "@/components/journey/RecoveryScreens";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incident recovery · KhetSe",
  description: "Review modeled recovery options and record a human decision.",
};

export default async function IncidentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; option?: string }>;
}) {
  const { id } = await params;
  if (id === CANONICAL_SHIPMENT_ID || id === "nashik") {
    const query = await searchParams;
    if (query.step === "approve") {
      return <ApprovalScreen option={query.option} />;
    }
    return <RecoveryChooser />;
  }
  const state = readOperations();
  const incident = state.incident;

  if (!incident || incident.id !== id) {
    return (
      <div className="space-y-5">
        <PageHeader
          kicker="INCIDENT RECORD"
          title="No incident found"
          description="The incident must be injected in the shipment demonstration before recovery options can be reviewed."
        />
        <Card>
          <p className="mb-4 text-sm text-charcoal-600">
            The demonstration incident ID is{" "}
            <span className="font-mono">{DEMO_INCIDENT_ID}</span>.
          </p>
          <Button href={`/shipments/${DEMO_SHIPMENT_ID}`}>
            Open demo shipment
          </Button>
        </Card>
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
    <div className="space-y-6 pb-8">
      <Link
        href={`/shipments/${incident.shipmentId}`}
        className="inline-flex text-sm font-semibold text-terracotta-700 underline-offset-2 hover:underline"
      >
        ← Back to shipment
      </Link>
      <PageHeader
        kicker="RECOVERY REVIEW · HUMAN DECISION REQUIRED"
        title="Incident recovery"
        description="Compare the options in the demonstration register. Opening this page does not change a booking; a person must choose and confirm a decision."
      />
      <DisruptionAlertBanner incident={incident} />

      <section aria-labelledby="recovery-options-title" className="space-y-3">
        <div>
          <h2
            id="recovery-options-title"
            className="text-lg font-semibold text-charcoal-950"
          >
            Recovery alternatives
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            Costs and shelf-life figures are modeled estimates supplied with the
            scenario.
          </p>
        </div>
        <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
          {storageOptions.map((option) => (
            <RecoveryOptionCard key={option.id} option={option} />
          ))}
        </div>
        {noAction ? <NoActionCard option={noAction} /> : null}
      </section>

      {incident.status === "OPEN" ? (
        <HumanApprovalModal
          incidentId={incident.id}
          options={incident.options}
        />
      ) : (
        <section aria-labelledby="decision-record-title" className="space-y-3">
          <div>
            <h2
              id="decision-record-title"
              className="text-lg font-semibold text-charcoal-950"
            >
              Recorded decision
            </h2>
            <p className="mt-1 text-sm text-charcoal-600">
              The scenario contains a completed decision record.
            </p>
          </div>
          <Card>
            <EventLogList entries={state.audit} />
          </Card>
        </section>
      )}
    </div>
  );
}
