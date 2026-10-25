import type { ReactNode } from "react";
import Link from "next/link";
import { readOperations } from "@/lib/operations/operations-store";
import { listHarvests } from "@/lib/planning/harvest-store";
import { formatIst, formatKg } from "@/lib/planning/format";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { DEMO_SHIPMENT_ID } from "@/lib/contracts/incident.contract";

export const dynamic = "force-dynamic";

export default function OperationsDashboard() {
  const harvests = listHarvests();
  const operations = readOperations();
  const { shipment, incident } = operations;
  const pendingIncident = incident?.status === "OPEN" ? incident : null;
  const recentEvents = [...shipment.events]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 3);

  return (
    <div className="space-y-7 pb-8">
      <PageHeader
        kicker="Recorded operations · separate from the farmer desk"
        title="Operations overview"
        description="The farmer desk is the modeled selling preview. This page is the operations record: harvest lots, the demonstration shipment, and recovery review."
        badge={<Badge tone="gray">SIMULATED DEMO</Badge>}
        actions={
          <>
            <Button href="/farmer">Open the farmer desk</Button>
            <Button href="/harvests/new" variant="secondary">
              Register harvest lot
            </Button>
            <Button href="/plans" variant="secondary">
              Compare plans
            </Button>
            <Button href="/simulation" variant="secondary">
              Open Simulation Lab
            </Button>
          </>
        }
      />

      <AlertBanner tone="modeled" title="Preview and persisted records">
        The farmer desk does not write the shipment shown here. A report
        generated on that desk is a modeled preview. Persisted shipment status
        on a shipment report is a stored record, and its financial comparison is
        still a modeled scenario, not that preview. Transit events are modeled
        milestones, not live GPS updates. The Simulation Lab clock does not
        recalculate money, and a temperature excursion is extra time in the
        registered stalled-hot pause, not a sensor reading.
      </AlertBanner>

      <section
        aria-label="Operational summary"
        className="grid gap-0 border-y border-sand-300 sm:grid-cols-3"
      >
        <SummaryItem
          label="Registered harvest lots"
          value={String(harvests.length)}
          detail="Local demonstration records"
        />
        <SummaryItem
          label="Shipment status"
          value={shipment.status.replaceAll("_", " ")}
          detail={shipment.id}
        />
        <SummaryItem
          label="Recovery review"
          value={
            pendingIncident
              ? "Needs review"
              : incident
                ? "Decision recorded"
                : "No incident"
          }
          detail={pendingIncident?.id ?? "Scenario state"}
        />
      </section>

      {pendingIncident && (
        <section aria-labelledby="recovery-review-title">
          <Card className="border-l-4 border-l-terracotta-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="terracotta">Decision required</Badge>
                  <span className="font-mono text-xs text-charcoal-500">
                    {pendingIncident.id}
                  </span>
                </div>
                <h2
                  id="recovery-review-title"
                  className="text-lg font-semibold text-charcoal-950"
                >
                  A simulated disruption is awaiting review
                </h2>
                <p className="max-w-2xl text-sm text-charcoal-600">
                  {pendingIncident.type.replaceAll("_", " ")} ·{" "}
                  {pendingIncident.checkpoint} · logged{" "}
                  {formatIst(pendingIncident.loggedAt)}
                </p>
              </div>
              <Button href={`/incidents/${pendingIncident.id}`}>
                Review recovery options
              </Button>
            </div>
          </Card>
        </section>
      )}

      <section aria-labelledby="shipment-title" className="space-y-3">
        <SectionHeading
          id="shipment-title"
          title="Shipment scenario"
          description="Recorded route and milestone status for the current demonstration shipment."
        />
        <Card>
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <DataPoint label="Shipment" value={shipment.id} mono />
              <DataPoint
                label="Crop and load"
                value={`${shipment.cropType} · ${formatKg(shipment.quantityKg)}`}
              />
              <DataPoint
                label="Route"
                value={`${shipment.originName} → ${shipment.destinationName}`}
              />
              <div>
                <div className="text-xs text-charcoal-500">Recorded status</div>
                <div className="mt-1">
                  <StatusIndicator status={shipment.status} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-sand-200 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <Button href={`/shipments/${shipment.id}`} variant="secondary">
                Open shipment
              </Button>
              <Button href={`/reports/${shipment.id}`} variant="secondary">
                {shipment.id === DEMO_SHIPMENT_ID
                  ? "Story report note"
                  : "View report"}
              </Button>
              {incident && (
                <Button href={`/incidents/${incident.id}`} variant="secondary">
                  Incident record
                </Button>
              )}
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-7 lg:grid-cols-[1.35fr_0.85fr]">
        <section aria-labelledby="harvests-title" className="space-y-3">
          <SectionHeading
            id="harvests-title"
            title="Harvest register"
            description="Lots entered for plan comparison."
            action={
              <Link
                className="text-sm font-semibold text-terracotta-700 hover:underline"
                href="/harvests/new"
              >
                Add lot →
              </Link>
            }
          />
          {harvests.length === 0 ? (
            <EmptyState
              title="No harvest lots recorded"
              description="Add a lot to compare available transport and market plans."
              actionLabel="Register a harvest lot"
              actionHref="/harvests/new"
            />
          ) : (
            <div className="divide-y divide-sand-300 border-y border-sand-300">
              {harvests.map((harvest) => (
                <article
                  key={harvest.harvestId}
                  className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-charcoal-950">
                        {harvest.cropType}
                      </h3>
                      <Badge tone="sage">{harvest.declaredQualityGrade}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-charcoal-600">
                      {harvest.originLocation.name} ·{" "}
                      {formatKg(harvest.quantityKg)} · harvested{" "}
                      {formatIst(harvest.harvestTimestamp)}
                    </p>
                  </div>
                  <Button
                    href={`/plans?harvestId=${encodeURIComponent(harvest.harvestId)}`}
                    variant="secondary"
                  >
                    Compare plans
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="events-title" className="space-y-3">
          <SectionHeading
            id="events-title"
            title="Recent scenario events"
            description="Latest shipment milestones recorded in the demo."
          />
          <ol className="border-l border-sand-400 pl-4">
            {recentEvents.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-linen ${event.urgent ? "bg-terracotta-500" : "bg-sage-600"}`}
                />
                <p className="text-xs font-mono text-charcoal-500">
                  {formatIst(event.at)}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-charcoal-900">
                  {event.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                  {event.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="py-4 sm:px-4 sm:first:pl-0 sm:border-r sm:border-sand-300 sm:last:border-r-0">
      <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold capitalize tabular-nums text-charcoal-950">
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-charcoal-500">{detail}</p>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-lg font-semibold text-charcoal-950">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-charcoal-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

function DataPoint({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-charcoal-500">{label}</div>
      <div
        className={`mt-1 break-words text-sm font-medium text-charcoal-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
