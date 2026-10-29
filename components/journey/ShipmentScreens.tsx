import Link from "next/link";
import { JourneyMap } from "@/components/map/JourneyMap";
import { ShipmentMonitor } from "@/components/journey/ShipmentMonitor";
import { MetricRow, PageTitle, StatusPill } from "@/components/shell/Chrome";
import {
  CANONICAL_SHIPMENT_ID,
  cropProfile,
  isMarketId,
  isRecoveryId,
  readQuantityKg,
  recoveryById,
  routeMap,
  trackingCheckpoints,
  type RecoveryId,
} from "@/lib/domain/baseline-journey";
import {
  addHours,
  formatHourCount,
  formatTimelineWhen,
} from "@/lib/demo/clock";
import { formatInrExact } from "@/lib/planning/format";

export function TrackingScreen({
  market,
  kg,
}: {
  market: string | undefined;
  kg: string | undefined;
}) {
  const quantityKg = readQuantityKg(kg);
  const marketId = isMarketId(market) ? market : "vashi";
  const tracking = trackingCheckpoints(marketId, quantityKg);
  const crop = cropProfile();
  if (!tracking) {
    return (
      <PageTitle
        title="Shipment unavailable"
        subtitle="That market is not feasible for this lot."
      />
    );
  }
  const lot = quantityKg === crop.quantityKg ? "" : `&kg=${quantityKg}`;
  const unloadHours = Number(
    (
      tracking.plan.completionHours -
      tracking.plan.arrivalHours -
      tracking.plan.waitingHours
    ).toFixed(1)
  );

  return (
    <div className="space-y-5 pb-6">
      <PageTitle
        title={`Shipment ${CANONICAL_SHIPMENT_ID}`}
        subtitle={`${crop.name} · ${crop.quantityKg.toLocaleString("en-IN")} kg · ${crop.originName.split(",")[0]} → ${tracking.plan.destination.replace(" APMC", "")}`}
        aside={<StatusPill tone="green">In transit</StatusPill>}
      />
      <JourneyMap points={tracking.points} lines={tracking.lines}>
        <div className="absolute left-4 top-4 rounded-xl bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold">Shipment route</p>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <span className="h-1 w-6 rounded bg-khet-green" />
            {crop.originName.split(",")[0]} → {tracking.plan.destination.replace(" APMC", "")}
          </p>
          <p className="mt-1 text-xs text-khet-muted">
            {tracking.distanceKm} km · {tracking.stops.length - 1} route legs
          </p>
        </div>
        <div className="absolute bottom-10 left-4 rounded-xl bg-white p-3 shadow-sm">
          <p className="text-sm font-bold">{crop.name}</p>
          <p className="text-sm text-khet-muted">
            {crop.quantityKg.toLocaleString("en-IN")} kg · {tracking.plan.vehicleName}
          </p>
        </div>
      </JourneyMap>
      <ShipmentMonitor
        routeId={tracking.plan.routeId}
        quantityKg={quantityKg}
        transitHours={tracking.transitHours}
        completionHours={tracking.plan.completionHours}
        dispatchAt={crop.dispatchAt}
        stops={tracking.stops}
        disruptionHref={`/shipments/${CANONICAL_SHIPMENT_ID}?phase=disrupted&market=${marketId}${lot}`}
        reportHref={`/reports/${CANONICAL_SHIPMENT_ID}?market=${marketId}${lot}`}
        completionNote={
          unloadHours > 0
            ? `Includes ${formatHourCount(unloadHours)} of unloading`
            : "Modeled completion from the baseline route"
        }
      />
    </div>
  );
}

export function DisruptionScreen({
  market,
}: {
  market: string | undefined;
}) {
  const marketId = isMarketId(market) ? market : "vashi";
  const tracking = trackingCheckpoints(marketId);
  const crop = cropProfile();
  if (!tracking) return null;
  const map = routeMap(tracking.plan.pointIds, marketId, "nashik");
  const breakdown = addHours(crop.dispatchAt, 1);

  return (
    <div className="space-y-5 pb-6">
      <PageTitle
        title="Shipment needs attention"
        subtitle={`${CANONICAL_SHIPMENT_ID} · Nashik checkpoint · ${formatTimelineWhen(breakdown.toISOString())} IST`}
        aside={<StatusPill tone="red">Disrupted</StatusPill>}
      />
      <div
        role="alert"
        className="rounded-2xl border border-khet-roseLine bg-khet-rose px-4 py-4"
      >
        <p className="font-semibold text-khet-roseInk">
          Vehicle breakdown at Nashik
        </p>
        <p className="mt-1 text-sm text-khet-roseInk/90">
          The shipment is stopped. Compare recovery options before choosing the
          next action.
        </p>
      </div>
      <JourneyMap points={map.points} lines={map.lines}>
        <div className="absolute left-4 top-4 rounded-xl bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold">Shipment route</p>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <span className="h-1 w-6 rounded bg-khet-green" />
            Pimpalgaon → {tracking.plan.destination.replace(" APMC", "")}
          </p>
          <p className="mt-1 text-xs text-khet-muted">
            {tracking.distanceKm} km · {tracking.stops.length - 1} route legs
          </p>
        </div>
        <div className="absolute bottom-10 left-4 max-w-[14rem] rounded-xl bg-white p-3 shadow-sm">
          <p className="text-sm font-bold">Breakdown at Nashik</p>
          <p className="text-sm text-khet-muted">Coordinator decision required</p>
        </div>
      </JourneyMap>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Your harvest is still recoverable</h2>
          <p className="mt-1 text-sm text-khet-muted">
            {crop.quantityKg.toLocaleString("en-IN")} kg · Stalled-hot environment
            · Quality continues to change
          </p>
        </div>
        <Link
          href={`/incidents/${CANONICAL_SHIPMENT_ID}?market=${marketId}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-khet-green px-4 text-sm font-semibold text-white"
        >
          Compare recovery options →
        </Link>
      </div>
    </div>
  );
}

export function RecoveryProgressScreen({
  option,
}: {
  option: string | undefined;
}) {
  const id: RecoveryId = isRecoveryId(option) ? option : "alternative-recovery";
  const view = recoveryById(id);
  const crop = cropProfile();
  const negative = view.tone === "negative";
  const baseline = id === "no-action";

  return (
    <div className="space-y-5 pb-6">
      <PageTitle
        title={baseline ? "Included repair in progress" : "Recovery in progress"}
        subtitle={`${CANONICAL_SHIPMENT_ID} · New destination: ${view.destination}`}
        aside={
          <StatusPill tone={negative ? "red" : baseline ? "amber" : "green"}>
            {negative
              ? "Counterexample approved"
              : baseline
                ? "No action recorded"
                : "Recovery approved"}
          </StatusPill>
        }
      />
      {negative ? (
        <p className="rounded-xl border border-khet-roseLine bg-khet-rose px-4 py-3 text-sm text-khet-roseInk">
          This approved counterexample has lower modeled net proceeds than
          taking no action. Nothing has been dispatched in the real world.
        </p>
      ) : null}
      <JourneyMap points={view.points} lines={view.lines}>
        <div className="absolute left-4 top-4 rounded-xl bg-white p-3 text-sm shadow-sm">
          <p className="font-semibold">Route comparison</p>
          <p className="mt-2 flex items-center gap-2">
            <span className="h-1 w-6 rounded bg-khet-green" />
            Recovery → {view.destination.replace(" APMC", "")}
          </p>
          <p className="mt-1 flex items-center gap-2">
            <span className="h-0 w-6 border-t-2 border-dashed border-[#d15a4a]" />
            No action → Vashi
          </p>
        </div>
        <div className="absolute bottom-10 left-4 rounded-xl bg-white p-3 text-sm shadow-sm">
          <p className="font-bold">Breakdown at Nashik</p>
          <p className="text-khet-muted">{view.summary}</p>
        </div>
      </JourneyMap>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <section className="rounded-2xl border border-khet-line p-5">
          <h2 className="text-lg font-bold">Recovery timeline</h2>
          <ol className="mt-4">
            {view.timeline.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-4 border-b border-khet-line py-3 last:border-b-0"
              >
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-khet-green"
                  />
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-xs text-khet-muted">{entry.detail}</p>
                  </div>
                </div>
                <time className="shrink-0 text-sm tabular-nums text-khet-muted">
                  {formatTimelineWhen(
                    addHours(crop.dispatchAt, entry.atHours).toISOString()
                  )}
                </time>
              </li>
            ))}
          </ol>
        </section>
        <aside className="rounded-2xl border border-khet-mint bg-khet-mist p-5">
          <h2 className="text-lg font-bold">Next: onward to {view.destination.replace(" APMC", "")}</h2>
          <dl className="mt-3">
            <MetricRow
              label="Onward transit"
              value={formatHourCount(view.onwardHours)}
            />
            <MetricRow
              label="Market arrival"
              value={formatTimelineWhen(
                addHours(crop.dispatchAt, view.arrivalHours).toISOString()
              )}
            />
            <MetricRow
              label="Wait for unloading"
              value={formatHourCount(view.waitingHours)}
            />
            <MetricRow
              label="Completion"
              value={formatTimelineWhen(
                addHours(crop.dispatchAt, view.completionHours).toISOString()
              )}
            />
          </dl>
          <Link
            href={`/reports/${CANONICAL_SHIPMENT_ID}?view=compare&compare=${
              id === "negative-recovery"
                ? "negative"
                : id === "vehicle-breakdown"
                  ? "repair"
                  : "recovery"
            }`}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-khet-green text-sm font-semibold text-white"
          >
            View modeled outcome →
          </Link>
          <p className="mt-3 text-xs text-khet-muted">
            Modeled net {formatInrExact(view.netProceedsInr)}. Demo approval
            only.
          </p>
        </aside>
      </div>
    </div>
  );
}
