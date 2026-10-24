"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getShipmentReportRows,
  shipmentReportSchema,
  shipmentReportToCsv,
  type ReportRow,
  type ShipmentReport as ShipmentReportData,
} from "@/lib/contracts/report.contract";
import { ScenarioControls } from "@/components/reports/ScenarioControls";
import { requestScenarioAction } from "@/components/reports/scenario-actions";

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
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {rows.map((row) => (
        <div
          key={`${row.section}-${row.item}`}
          className="grid gap-1 py-3 sm:grid-cols-[minmax(10rem,0.8fr)_1.2fr] sm:gap-4"
        >
          <dt className="text-sm text-gray-600 dark:text-gray-400">
            {row.item}
          </dt>
          <dd className="break-words text-sm font-medium text-gray-950 dark:text-gray-100">
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
          className={`break-inside-avoid rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${section === "Modeled financial comparison" ? "md:col-span-2" : ""}`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-950 dark:text-gray-100">
              {section}
            </h2>
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
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    async function loadReport() {
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
  }, [reportId]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/30 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">
            Shipment audit
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Report {reportId}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700 dark:text-gray-300">
            A report view based on the fields currently defined by the shipment
            report contract.
          </p>
        </div>
        {state.status === "ready" ? (
          <div className="flex flex-wrap gap-2 print:hidden">
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
          </div>
        ) : null}
      </header>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>Data notice.</strong> Shipment reports may contain synthetic
        demonstration data. Financial values are modeled estimates, not realized
        proceeds. The report makes no guaranteed-price or live-GPS claims.
      </div>

      {state.status === "loading" ? (
        <div
          role="status"
          className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          Loading report…
        </div>
      ) : null}
      {state.status === "unavailable" ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-white p-6 dark:border-amber-900 dark:bg-gray-900"
        >
          <h2 className="font-semibold text-gray-950 dark:text-gray-100">
            Report unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {state.message}
          </p>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <>
          <ShipmentReportSections report={state.report} />
          <ScenarioControls
            onReset={() => requestScenarioAction("reset")}
            onReplay={() => requestScenarioAction("replay")}
          />
        </>
      ) : null}
    </div>
  );
}
