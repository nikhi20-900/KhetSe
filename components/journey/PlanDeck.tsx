"use client";

import { useState } from "react";
import Link from "next/link";
import type { DirectPlan, VehicleBlock } from "@/lib/domain/baseline-journey";
import { formatInrExact, formatKg } from "@/lib/planning/format";
import { formatHourCount } from "@/lib/demo/clock";

export function PlanDeck({
  plans,
  reefer,
  quantityKg,
}: {
  plans: DirectPlan[];
  reefer: VehicleBlock | null;
  quantityKg: number;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const ordered = [...plans].sort((left, right) => rank(left) - rank(right));
  const lot =
    quantityKg === 10_000 ? "" : `&kg=${encodeURIComponent(String(quantityKg))}`;

  return (
    <div className="space-y-4">
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {ordered.map((plan) => {
          const featured = plan.badges[0] === "Lowest logistics cost";
          const open = previewId === plan.marketId;
          return (
            <article
              key={plan.marketId}
              className={`flex flex-col rounded-2xl border p-5 ${
                featured
                  ? "border-khet-green bg-khet-mist shadow-sm"
                  : "border-khet-line bg-white"
              }`}
            >
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    plan.badges[0]?.includes("Fastest")
                      ? "bg-[#f8efd4] text-[#8a5a18]"
                      : "bg-khet-mint text-khet-green"
                  }`}
                >
                  {plan.badges[0]}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">
                {plan.destination}
              </h2>
              <p className="mt-1 text-sm text-khet-muted">
                {plan.vehicleCount} × {plan.vehicleName}
              </p>
              <dl className="mt-4">
                <Row label="Distance" value={`${plan.distanceKm} km`} />
                <Row
                  label="Transit"
                  value={formatHourCount(plan.transitHours)}
                />
                <Row
                  label="Estimated costs"
                  value={formatInrExact(plan.logisticsCostInr)}
                />
                <Row
                  label="Capacity"
                  value={`${new Intl.NumberFormat("en-IN").format(plan.requiredKg)} / ${formatKg(plan.capacityKg)}`}
                />
              </dl>
              <div className="mt-4 border-t border-khet-line/80 pt-4">
                <p className="text-sm text-khet-muted">Modeled net proceeds</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {formatInrExact(plan.netProceedsInr)}
                </p>
              </div>
              {plan.shelfLifeNote ? (
                <p className="mt-3 text-sm text-[#8a5a18]">{plan.shelfLifeNote}</p>
              ) : null}
              {open ? (
                <dl className="mt-4 rounded-xl bg-white/80 p-3 text-sm">
                  {plan.costRows.map((row) => (
                    <Row
                      key={row.key}
                      label={row.label}
                      value={formatInrExact(row.amountInr)}
                    />
                  ))}
                  <p className="pt-2 text-xs text-khet-muted">
                    {plan.via}. Unloading window {plan.unloadingWindow}. Modeled
                    estimate.
                  </p>
                </dl>
              ) : null}
              <div className="mt-5">
                {featured ? (
                  <Link
                    href={`/reservations/new?market=${plan.marketId}${lot}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-khet-green px-4 text-sm font-semibold text-white hover:bg-khet-greenDark"
                  >
                    Select demo route →
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-khet-line bg-white px-4 text-sm font-semibold hover:bg-khet-sand"
                    aria-expanded={open}
                    onClick={() =>
                      setPreviewId(open ? null : plan.marketId)
                    }
                  >
                    {open ? "Hide preview" : "Preview this plan →"}
                  </button>
                )}
                {featured ? null : (
                  <Link
                    href={`/reservations/new?market=${plan.marketId}${lot}`}
                    className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-khet-green"
                  >
                    Select this plan
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {reefer ? (
        <div
          role="status"
          className="flex gap-3 rounded-2xl border border-khet-roseLine bg-khet-rose px-4 py-4"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm text-khet-roseInk"
          >
            !
          </span>
          <div>
            <p className="font-semibold text-khet-roseInk">
              1 reefer van cannot carry this lot
            </p>
            <p className="mt-1 text-sm text-khet-roseInk/90">{reefer.message}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function rank(plan: DirectPlan): number {
  const badge = plan.badges[0] ?? "";
  if (badge.startsWith("Lowest")) return 0;
  if (badge.startsWith("Fastest")) return 1;
  return 2;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-khet-muted">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
