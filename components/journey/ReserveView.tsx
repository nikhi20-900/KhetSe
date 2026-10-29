import Link from "next/link";
import { ConfirmDispatch } from "@/components/journey/ConfirmDispatch";
import { MetricRow, PageTitle, StatusPill, WorkflowStepper } from "@/components/shell/Chrome";
import {
  CANONICAL_SHIPMENT_ID,
  cropProfile,
  isMarketId,
  planByMarket,
  readQuantityKg,
} from "@/lib/domain/baseline-journey";
import {
  addHours,
  formatDayTime,
  formatHourCount,
} from "@/lib/demo/clock";
import { formatInrExact, formatKg } from "@/lib/planning/format";

export function ReserveView({
  market,
  kg,
}: {
  market: string | undefined;
  kg: string | undefined;
}) {
  const quantityKg = readQuantityKg(kg);
  const marketId = isMarketId(market) ? market : null;
  const plan = marketId ? planByMarket(marketId, quantityKg) : null;
  const crop = cropProfile();

  if (!plan) {
    return (
      <div className="space-y-4">
        <PageTitle
          title="Review & reserve"
          subtitle="Choose a feasible plan before confirming a demo dispatch."
        />
        <Link href="/plans" className="font-semibold text-khet-green">
          Back to plans
        </Link>
      </div>
    );
  }

  const lot = quantityKg === crop.quantityKg ? "" : `&kg=${quantityKg}`;
  const arrival = addHours(crop.dispatchAt, plan.arrivalHours).toISOString();

  return (
    <div className="space-y-6 pb-8">
      <PageTitle
        title="Review & reserve"
        subtitle="Confirm the route and capacity before dispatch."
        aside={<StatusPill tone="amber">Awaiting reservation</StatusPill>}
      />
      <WorkflowStepper
        current={3}
        hrefFor={(id, href) =>
          id === 3 ? `/reservations/new?market=${plan.marketId}${lot}` : href
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <section className="rounded-2xl border border-khet-line p-5 sm:p-6">
          <h2 className="text-2xl font-bold">
            {crop.originName.split(",")[0]} → {plan.destination}
          </h2>
          <p className="mt-1 text-sm text-khet-muted">
            {plan.via} · {plan.distanceKm} km
          </p>
          <h3 className="mt-6 font-bold">Vehicle allocation</h3>
          <dl className="mt-2">
            <MetricRow label="Vehicle" value={plan.vehicleName} />
            <MetricRow
              label="Reserved mass"
              value={`${formatKg(plan.requiredKg)} / ${formatKg(plan.capacityKg)}`}
            />
            <MetricRow
              label="Reserved volume"
              value={`${plan.volumeM3} m³ / ${plan.vehicleVolumeM3} m³`}
            />
            <MetricRow
              label="Dispatch"
              value={formatDayTime(crop.dispatchAt)}
            />
            <MetricRow label="Expected arrival" value={formatDayTime(arrival)} />
            <MetricRow label="Unloading window" value={plan.unloadingWindow} />
          </dl>
          <p className="mt-4 rounded-xl bg-khet-sand px-4 py-3 text-sm text-khet-muted">
            Capacity is checked again when the reservation is confirmed. This
            demo does not lock a real vehicle.
          </p>
        </section>
        <aside className="rounded-2xl border border-khet-mint bg-khet-mist p-5 sm:p-6">
          <h2 className="text-xl font-bold">Modeled cost summary</h2>
          <dl className="mt-4">
            {plan.costRows.map((row) => (
              <MetricRow
                key={row.key}
                label={row.label}
                value={formatInrExact(row.amountInr)}
              />
            ))}
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-khet-line pt-3">
            <span className="font-semibold">Total estimate</span>
            <span className="text-lg font-bold tabular-nums">
              {formatInrExact(plan.logisticsCostInr)}
            </span>
          </div>
          <p className="mt-2 text-xs text-khet-muted">
            Transit {formatHourCount(plan.transitHours)}. Net proceeds{" "}
            {formatInrExact(plan.netProceedsInr)} after modeled sale.
          </p>
          <div className="mt-5">
            <ConfirmDispatch
              href={`/shipments/${CANONICAL_SHIPMENT_ID}?market=${plan.marketId}${lot}`}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
