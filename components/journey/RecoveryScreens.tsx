import Link from "next/link";
import { ApprovalPanel } from "@/components/journey/ApprovalPanel";
import { ExportRecords } from "@/components/journey/ExportRecords";
import { JourneyMap } from "@/components/map/JourneyMap";
import { MetricRow, PageTitle, StatusPill } from "@/components/shell/Chrome";
import {
  CANONICAL_SHIPMENT_ID,
  comparisonFor,
  costBreakdownCsv,
  cropProfile,
  eventHistoryCsv,
  isMarketId,
  isRecoveryId,
  journeyReportText,
  planByMarket,
  readQuantityKg,
  recoveryById,
  recoveryViews,
  routeMap,
  type RecoveryId,
} from "@/lib/domain/baseline-journey";
import { addHours, formatHourCount, formatLongDate } from "@/lib/demo/clock";
import { formatInrExact, formatKgPrecise, formatSignedInr } from "@/lib/planning/format";

export function RecoveryChooser() {
  const views = recoveryViews();
  const primary = views.filter((view) => view.id !== "negative-recovery");
  const negative = recoveryById("negative-recovery");

  return (
    <div className="space-y-5 pb-6">
      <PageTitle
        title="Choose a recovery"
        subtitle="All options start from the same Nashik breakdown."
        aside={<StatusPill tone="amber">Human approval required</StatusPill>}
      />
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {primary.map((view) => {
          const compare =
            view.id === "vehicle-breakdown" ? "repair" : "recovery";
          return (
            <article
              key={view.id}
              className={`flex flex-col rounded-2xl border p-5 ${
                view.recommended
                  ? "border-khet-green bg-khet-mist"
                  : "border-khet-line bg-white"
              }`}
            >
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                  view.tone === "baseline"
                    ? "bg-[#f8efd4] text-[#8a5a18]"
                    : view.recommended
                      ? "bg-khet-mint text-khet-green"
                      : "bg-khet-mint text-khet-green"
                }`}
              >
                {view.eyebrow}
              </span>
              <h2 className="mt-4 text-2xl font-bold">{view.title}</h2>
              <p className="mt-2 text-sm text-khet-muted">{view.summary}</p>
              <div className="mt-4 border-t border-khet-line/80 pt-4">
                <p className="text-sm text-khet-muted">Modeled net proceeds</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {formatInrExact(view.netProceedsInr)}
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    view.deltaInr == null
                      ? "text-khet-green"
                      : view.deltaInr > 0
                        ? "text-khet-green"
                        : "text-khet-roseInk"
                  }`}
                >
                  {view.deltaInr == null
                    ? "Reference outcome"
                    : formatSignedInr(view.deltaInr)}
                </p>
                <p className="mt-1 text-sm text-khet-muted">
                  Grade {view.grade} · {formatHourCount(view.completionHours)} total
                </p>
              </div>
              <div className="mt-5 space-y-2">
                {view.recommended ? (
                  <Link
                    href={`/incidents/${CANONICAL_SHIPMENT_ID}?step=approve&option=${view.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-khet-green text-sm font-semibold text-white"
                  >
                    Review & approve →
                  </Link>
                ) : (
                  <Link
                    href={`/reports/${CANONICAL_SHIPMENT_ID}?view=compare&compare=${compare}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-khet-line text-sm font-semibold"
                  >
                    View comparison →
                  </Link>
                )}
                {view.recommended ? null : (
                  <Link
                    href={`/incidents/${CANONICAL_SHIPMENT_ID}?step=approve&option=${view.id}`}
                    className="inline-flex min-h-10 w-full items-center justify-center text-sm font-semibold text-khet-green"
                  >
                    Review & approve this option
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <article className="rounded-2xl border border-khet-roseLine bg-khet-rose p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-khet-roseInk">
          {negative.eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-bold">{negative.title}</h2>
        <p className="mt-1 text-sm text-khet-roseInk">{negative.summary}</p>
        <p className="mt-3 text-2xl font-bold tabular-nums">
          {formatInrExact(negative.netProceedsInr)}
        </p>
        <p className="text-sm font-semibold text-khet-roseInk">
          {formatSignedInr(negative.deltaInr ?? 0)} versus no action
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/reports/${CANONICAL_SHIPMENT_ID}?view=compare&compare=negative`}
            className="inline-flex min-h-11 items-center rounded-lg border border-khet-roseInk/30 px-4 text-sm font-semibold"
          >
            View comparison →
          </Link>
          <Link
            href={`/incidents/${CANONICAL_SHIPMENT_ID}?step=approve&option=negative-recovery`}
            className="inline-flex min-h-11 items-center text-sm font-semibold"
          >
            Review this counterexample
          </Link>
        </div>
      </article>
      <div className="rounded-2xl border border-[#ead9a4] bg-khet-cream px-4 py-4">
        <p className="font-semibold">No action is a real alternative</p>
        <p className="mt-1 text-sm text-khet-muted">
          The lot continues to Vashi after the carrier’s included repair. The
          baseline includes its modeled sale proceeds and costs.
        </p>
      </div>
    </div>
  );
}

export function ApprovalScreen({ option }: { option: string | undefined }) {
  const id: RecoveryId = isRecoveryId(option) ? option : "alternative-recovery";
  const view = recoveryById(id);
  const facts = view.approval;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <PageTitle
        title="Approve the recovery plan"
        subtitle="One explicit decision before the route changes."
        aside={<StatusPill tone="amber">Awaiting approval</StatusPill>}
      />
      <section className="rounded-2xl border border-khet-line p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{facts.title}</h2>
          <StatusPill tone={view.recommended ? "green" : "amber"}>
            {view.recommended ? "Selected plan" : "Selected option"}
          </StatusPill>
        </div>
        <dl className="mt-4">
          <MetricRow label="Transfer at" value={facts.transferAt} />
          <MetricRow label="Replacement vehicle" value={facts.vehicle} />
          <MetricRow label="Storage" value={facts.storage} />
          <MetricRow label="Destination" value={facts.destination} />
          <MetricRow
            label="Direct intervention spend"
            value={formatInrExact(facts.interventionInr)}
          />
          <MetricRow
            label="Modeled net proceeds"
            value={formatInrExact(facts.netInr)}
          />
          <MetricRow
            label="Difference vs no action"
            value={
              facts.deltaInr == null ? "Reference outcome" : formatSignedInr(facts.deltaInr)
            }
          />
        </dl>
        <p className="mt-4 rounded-xl bg-khet-sand px-4 py-3 text-sm text-khet-muted">
          {facts.journeyNote} The full journey includes transfer, storage intake
          and release, onward travel, market waiting and unloading where those
          steps exist.
        </p>
        {view.tone === "negative" ? (
          <p className="mt-3 text-sm font-semibold text-khet-roseInk">
            Approving this option records a worse modeled outcome. It is not
            recommended.
          </p>
        ) : null}
        <ApprovalPanel
          backHref={`/incidents/${CANONICAL_SHIPMENT_ID}`}
          nextHref={`/shipments/${CANONICAL_SHIPMENT_ID}?phase=recovery&option=${view.id}`}
        />
      </section>
    </div>
  );
}

export function ComparisonScreen({ mode }: { mode: string | undefined }) {
  const comparison = comparisonFor(mode ?? "recovery");
  const crop = cropProfile();

  return (
    <div className="space-y-5 pb-6">
      <PageTitle
        title="Recovery comparison"
        subtitle={`${crop.name} · ${crop.quantityKg.toLocaleString("en-IN")} kg · Shipment ${CANONICAL_SHIPMENT_ID}`}
        aside={
          <Link
            href={`/reports/${CANONICAL_SHIPMENT_ID}?option=${comparison.recovery.id}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-khet-line px-4 text-sm font-semibold"
          >
            View report →
          </Link>
        }
      />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["recovery", "Recovery case"],
            ["negative", "Negative recovery"],
            ["equal", "Equal-outcome illustration"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={`/reports/${CANONICAL_SHIPMENT_ID}?view=compare&compare=${id}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              comparison.mode === id
                ? "border-khet-green bg-khet-mist text-khet-green"
                : "border-khet-line"
            }`}
            aria-current={comparison.mode === id ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
      {comparison.illustrative ? (
        <p className="rounded-xl border border-[#ead9a4] bg-khet-cream px-4 py-3 text-sm">
          {comparison.note}
        </p>
      ) : null}
      <JourneyMap points={comparison.recovery.points} lines={comparison.recovery.lines}>
        <div className="absolute left-4 top-4 rounded-xl bg-white p-3 text-sm shadow-sm">
          <p className="font-semibold">Route comparison</p>
          <p className="mt-2 flex items-center gap-2">
            <span className="h-1 w-6 rounded bg-khet-green" />
            {comparison.illustrative ? "Illustration" : "Recovery"} →{" "}
            {comparison.recovery.destination.replace(" APMC", "")}
          </p>
          <p className="mt-1 flex items-center gap-2">
            <span className="h-0 w-6 border-t-2 border-dashed border-[#d15a4a]" />
            No action → Vashi
          </p>
        </div>
      </JourneyMap>
      <h2 className="text-xl font-bold">Modeled financial outcome</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-khet-mist p-5">
          <p className="text-sm text-khet-muted">
            {comparison.illustrative ? "Illustrated recovery" : "Recovery"}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatInrExact(comparison.recovery.netProceedsInr)}
          </p>
          <p className="mt-1 text-sm text-khet-muted">{comparison.recovery.title}</p>
        </article>
        <article className="rounded-2xl bg-khet-rose p-5">
          <p className="text-sm text-khet-muted">No action</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatInrExact(comparison.baseline.netProceedsInr)}
          </p>
          <p className="mt-1 text-sm text-khet-muted">Included repair + continue</p>
        </article>
        <article className="rounded-2xl bg-khet-cream p-5">
          <p className="text-sm text-khet-muted">Difference</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatSignedInr(comparison.deltaInr)}
          </p>
          <p className="mt-1 text-sm text-khet-muted">
            {comparison.deltaInr > 0
              ? "Higher modeled net proceeds"
              : comparison.deltaInr < 0
                ? "Lower modeled net proceeds"
                : "Illustrated zero difference"}
          </p>
        </article>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-khet-green">
            Costs and assumptions
          </summary>
          <dl className="mt-3 max-w-md">
            {comparison.recovery.costRows.map((row) => (
              <MetricRow
                key={row.key}
                label={row.label}
                value={formatInrExact(row.amountInr)}
              />
            ))}
          </dl>
          <p className="mt-2 max-w-xl text-sm text-khet-muted">{comparison.note}</p>
        </details>
        <p className="text-sm text-khet-muted">
          Same initial lot and breakdown · synthetic estimates
        </p>
      </div>
      <p className="text-sm text-khet-muted">
        Higher modeled proceeds are not a guaranteed financial gain.
      </p>
    </div>
  );
}

export function CanonicalReport({
  option,
  market,
  kg,
}: {
  option: string | undefined;
  market: string | undefined;
  kg: string | undefined;
}) {
  const crop = cropProfile();
  if (isRecoveryId(option)) {
    const view = recoveryById(option);
    const baseline = recoveryById("no-action");
    const completed = addHours(crop.dispatchAt, view.completionHours);
    return (
      <ReportLayout
        title="Shipment report"
        subtitle={`${CANONICAL_SHIPMENT_ID} · Recovery to ${view.destination.replace(" APMC", "")} · ${formatLongDate(completed.toISOString())}`}
        rows={[
          ["Completion", `${formatHourCount(view.completionHours)} after dispatch`],
          ["Arrival grade", view.grade],
          ["Saleable mass", formatKgPrecise(view.saleableKg)],
          ["Gross proceeds", formatInrExact(view.grossProceedsInr)],
          ["Total journey costs", formatInrExact(view.totalCostsInr)],
          ["Net proceeds", formatInrExact(view.netProceedsInr)],
        ]}
        costs={view.costRows.map((row) => [row.label, formatInrExact(row.amountInr)] as const)}
        delta={view.deltaInr}
        files={[
          {
            title: "Journey report",
            meta: "Text · Proposed export",
            filename: `${CANONICAL_SHIPMENT_ID}-journey.txt`,
            content: journeyReportText(view, baseline),
          },
          {
            title: "Event history",
            meta: "CSV · Proposed export",
            filename: `${CANONICAL_SHIPMENT_ID}-events.csv`,
            content: eventHistoryCsv(view),
          },
          {
            title: "Cost breakdown",
            meta: "CSV · Proposed export",
            filename: `${CANONICAL_SHIPMENT_ID}-costs.csv`,
            content: costBreakdownCsv(view),
          },
        ]}
        replayHref={`/shipments/${CANONICAL_SHIPMENT_ID}?market=${
          view.destination.startsWith("Pune")
            ? "pune"
            : view.destination.startsWith("Surat")
              ? "surat"
              : "vashi"
        }`}
      />
    );
  }

  const marketId = isMarketId(market) ? market : "vashi";
  const quantityKg = readQuantityKg(kg);
  const plan = planByMarket(marketId, quantityKg);
  if (!plan) {
    return (
      <PageTitle
        title="Shipment report"
        subtitle="That plan is not feasible for this lot."
      />
    );
  }
  const completed = addHours(crop.dispatchAt, plan.completionHours);
  const map = routeMap(plan.pointIds, marketId);
  const eventCsv = [
    "Elapsed hours,Checkpoint",
    ...map.points.map((point, index) => `${index},"${point.label}"`),
  ].join("\r\n");
  return (
    <ReportLayout
      title="Shipment report"
      subtitle={`${CANONICAL_SHIPMENT_ID} · ${plan.destination} · ${formatLongDate(completed.toISOString())}`}
      rows={[
        ["Completion", `${formatHourCount(plan.completionHours)} after dispatch`],
        ["Arrival grade", plan.grade],
        ["Saleable mass", formatKgPrecise(plan.saleableKg)],
        ["Gross proceeds", formatInrExact(plan.grossProceedsInr)],
        ["Total journey costs", formatInrExact(plan.logisticsCostInr)],
        ["Net proceeds", formatInrExact(plan.netProceedsInr)],
      ]}
      costs={plan.costRows.map((row) => [row.label, formatInrExact(row.amountInr)] as const)}
      delta={null}
      files={[
        {
          title: "Journey report",
          meta: "Text · Proposed export",
          filename: `${CANONICAL_SHIPMENT_ID}-journey.txt`,
          content: [
            `KhetSe shipment report ${CANONICAL_SHIPMENT_ID}`,
            "SIMULATED undisrupted journey.",
            `Destination: ${plan.destination}`,
            `Net proceeds INR: ${plan.netProceedsInr}`,
            `Costs INR: ${plan.logisticsCostInr}`,
            `Gross INR: ${plan.grossProceedsInr}`,
          ].join("\n"),
        },
        {
          title: "Event history",
          meta: "CSV · Proposed export",
          filename: `${CANONICAL_SHIPMENT_ID}-events.csv`,
          content: eventCsv,
        },
        {
          title: "Cost breakdown",
          meta: "CSV · Proposed export",
          filename: `${CANONICAL_SHIPMENT_ID}-costs.csv`,
          content: [
            "Item,Amount INR",
            ...plan.costRows.map((row) => `${row.label},${row.amountInr.toFixed(2)}`),
            `Total,${plan.logisticsCostInr.toFixed(2)}`,
          ].join("\r\n"),
        },
      ]}
      replayHref={`/shipments/${CANONICAL_SHIPMENT_ID}?market=${marketId}`}
      quietComparison="No disruption was modeled on this journey. Open a breakdown to compare recovery with no action."
    />
  );
}

function ReportLayout({
  title,
  subtitle,
  rows,
  costs,
  delta,
  files,
  replayHref,
  quietComparison,
}: {
  title: string;
  subtitle: string;
  rows: [string, string][];
  costs: readonly (readonly [string, string])[];
  delta: number | null;
  files: { title: string; meta: string; filename: string; content: string }[];
  replayHref: string;
  quietComparison?: string;
}) {
  return (
    <div className="space-y-5 pb-8">
      <PageTitle
        title={title}
        subtitle={subtitle}
        aside={<StatusPill tone="green">Completed</StatusPill>}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-khet-line p-5">
            <h2 className="text-lg font-bold">Modeled outcome</h2>
            <dl className="mt-2">
              {rows.map(([label, value]) => (
                <MetricRow key={label} label={label} value={value} />
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border border-khet-line p-5">
            <h2 className="text-lg font-bold">Cost breakdown</h2>
            <dl className="mt-2">
              {costs.map(([label, value]) => (
                <MetricRow key={label} label={label} value={value} />
              ))}
            </dl>
          </section>
        </div>
        <div className="space-y-4">
          <section className="rounded-2xl bg-khet-mist p-5">
            <h2 className="text-lg font-bold">
              {delta == null ? "Undisrupted journey" : "Compared with no action"}
            </h2>
            {delta == null ? (
              <p className="mt-3 text-sm text-khet-muted">{quietComparison}</p>
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {formatSignedInr(delta)}
                </p>
                <p className="mt-1 text-sm font-semibold text-khet-green">
                  {delta >= 0
                    ? "Higher modeled net proceeds"
                    : "Lower modeled net proceeds"}
                </p>
              </>
            )}
            <p className="mt-2 text-sm text-khet-muted">
              A comparison of synthetic scenarios, not realized income or a
              guaranteed gain.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold">Export records</h2>
            <div className="mt-3">
              <ExportRecords files={files} />
            </div>
            <p className="mt-3 text-xs text-khet-muted">
              All costs and operational inputs come from the demo baseline.
              Exports are proposed records of the figures on this page.
            </p>
          </section>
          <Link
            href={replayHref}
            className="inline-flex min-h-11 items-center rounded-lg border border-khet-line px-4 text-sm font-semibold"
          >
            Replay the journey →
          </Link>
        </div>
      </div>
    </div>
  );
}
