"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getShipmentReportRows,
  shipmentReportSchema,
  shipmentReportToCsv,
  type ReportRow,
  type ShipmentReport as ShipmentReportData,
} from "@/lib/contracts/report.contract";
import { ScenarioControls } from "@/components/reports/ScenarioControls";
import {
  requestScenarioAction,
  scenarioActionDetail,
} from "@/components/reports/scenario-actions";
import { DEMO_SHIPMENT_ID } from "@/lib/contracts/incident.contract";

type LoadState =
  | { status: "loading" }
  | { status: "unavailable"; message: string }
  | { status: "ready"; report: ShipmentReportData };

export function downloadShipmentReportCsv(
  report: ShipmentReportData,
  download: (content: string, filename: string) => void
) {
  download(
    shipmentReportToCsv(report),
    `shipment-report-${report.reportId}.csv`
  );
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ReportRows({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="divide-y divide-sand-200">
      {rows.map((row, index) => (
        <div
          key={`${row.section}-${row.item}-${index}`}
          className="grid gap-1 py-3 sm:grid-cols-[minmax(10rem,0.8fr)_1.2fr] sm:gap-4"
        >
          <dt className="text-sm text-charcoal-600">{row.item}</dt>
          <dd className="break-words text-sm font-medium text-charcoal-950">
            {row.value}
          </dd>
        </div>
      ))}
    </div>
  );
}

export function ShipmentReportSections({
  report,
}: {
  report: ShipmentReportData;
}) {
  const rows = getShipmentReportRows(report);
  const grouped = new Map<string, ReportRow[]>();
  for (const row of rows) {
    grouped.set(row.section, [...(grouped.get(row.section) ?? []), row]);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...grouped.entries()].map(([section, sectionRows]) => (
        <section
          key={section}
          className={`break-inside-avoid rounded-lg border border-sand-300 bg-white p-5 shadow-xs ${section === "Modeled financial comparison" ? "md:col-span-2" : ""}`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-charcoal-950">{section}</h2>
            {section === "Modeled financial comparison" ? (
              <Badge variant="info">Modeled estimate</Badge>
            ) : null}
            {section === "Report" && report.isSimulatedData ? (
              <Badge variant="warning">Synthetic data</Badge>
            ) : null}
          </div>
          <dl>
            <ReportRows rows={sectionRows} />
          </dl>
        </section>
      ))}
    </div>
  );
}

export function ShipmentReport({ reportId }: { reportId: string }) {
  const storyOnly = reportId === DEMO_SHIPMENT_ID;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (storyOnly) return;
    const controller = new AbortController();
    async function loadReport() {
      setState({ status: "loading" });
      try {
        const response = await fetch(
          `/api/reports/${encodeURIComponent(reportId)}`,
          {
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          setState({
            status: "unavailable",
            message:
              response.status === 501
                ? "The report service is not implemented yet. No report data was loaded."
                : `The report could not be loaded (HTTP ${response.status}).`,
          });
          return;
        }
        const parsed = shipmentReportSchema.safeParse(await response.json());
        if (!parsed.success) {
          setState({
            status: "unavailable",
            message:
              "The report response does not match the documented API contract.",
          });
          return;
        }
        setState({ status: "ready", report: parsed.data });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "unavailable",
          message:
            error instanceof Error
              ? error.message
              : "The report could not be loaded.",
        });
      }
    }
    void loadReport();
    return () => controller.abort();
  }, [reportId, retryCount, storyOnly]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <PageHeader
        kicker={storyOnly ? "LOCAL STORY" : "SHIPMENT REPORT"}
        title={storyOnly ? "Igatpuri story" : `Report ${reportId}`}
        badge={
          <Badge tone="gray">
            {storyOnly ? "NOT STORED" : "CONTRACT DATA"}
          </Badge>
        }
        description={
          storyOnly
            ? "This address is the local demonstration story. It is not a stored shipment report."
            : "Review the recorded shipment details and modeled financial estimates."
        }
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              href={`/shipments/${encodeURIComponent(reportId)}`}
              variant="secondary"
            >
              Back to shipment
            </Button>
            {state.status === "unavailable" ? (
              <Button
                variant="secondary"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Try again
              </Button>
            ) : null}
            {state.status === "ready" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadShipmentReportCsv(state.report, downloadCsv)
                  }
                >
                  Export CSV
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  Print report
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {storyOnly ? (
        <AlertBanner tone="info" title="Igatpuri story, not a stored shipment">
          <p>
            {DEMO_SHIPMENT_ID} is the local JSON demonstration. It has no
            PostgreSQL shipment row, so this page does not invent a persisted
            status or a sale. The timeline stays on the shipment story. A stored
            report is available only for a shipment id created by dispatch.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button href={`/shipments/${DEMO_SHIPMENT_ID}`} variant="secondary">
              Open the Igatpuri story
            </Button>
            <Button href="/farmer" variant="secondary">
              Open the farmer desk
            </Button>
          </div>
        </AlertBanner>
      ) : null}

      {storyOnly ? null : (
        <AlertBanner
          tone="modeled"
          title="Persisted status and modeled preview"
        >
          Persisted shipment status is the status stored for this shipment id.
          The financial comparison is a modeled preview of the registered
          alternative-recovery and no-action scenarios. It is not the
          farmer-desk report, and it is not a completed sale. Financial values
          are modeled estimates. The report makes no guaranteed-price or
          live-GPS claims.
        </AlertBanner>
      )}

      {state.status === "loading" && !storyOnly ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-sand-300 bg-white p-6 text-sm text-charcoal-600"
        >
          Loading report…
        </div>
      ) : null}
      {state.status === "unavailable" ? (
        <div
          role="alert"
          className="rounded-lg border border-terracotta-300 bg-white p-6"
        >
          <h2 className="font-semibold text-charcoal-950">
            Report unavailable
          </h2>
          <p className="mt-2 text-sm text-charcoal-700">{state.message}</p>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <>
          <ShipmentReportSections report={state.report} />
          <ScenarioControls
            onReset={async () =>
              scenarioActionDetail(await requestScenarioAction("reset"))
            }
            onReplay={async () =>
              scenarioActionDetail(await requestScenarioAction("replay"))
            }
          />
        </>
      ) : null}
    </div>
  );
}
