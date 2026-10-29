import Link from "next/link";
import { JourneyMap } from "@/components/map/JourneyMap";
import { PageTitle } from "@/components/shell/Chrome";
import {
  cropProfile,
  directMarketPlans,
  trackingCheckpoints,
} from "@/lib/domain/baseline-journey";
import { readOperations } from "@/lib/operations/operations-store";
import { formatKg } from "@/lib/planning/format";

export const dynamic = "force-dynamic";

export default function HarvestOverviewPage() {
  const crop = cropProfile();
  const plans = directMarketPlans().plans;
  const route = trackingCheckpoints("vashi");
  const incident = readOperations().incident;
  if (!route) return null;

  return (
    <div className="space-y-6 pb-4">
      <PageTitle
        title="Harvest overview"
        subtitle="From farm gate to market, with every decision in view."
        aside={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/farmer"
              className="inline-flex min-h-11 items-center rounded-lg border border-khet-line bg-white px-4 text-sm font-semibold hover:bg-khet-sand"
            >
              Farmer desk
            </Link>
            <Link
              href="/harvests/new"
              className="inline-flex min-h-11 items-center rounded-lg bg-khet-green px-4 text-sm font-semibold text-white hover:bg-khet-greenDark"
            >
              New harvest →
            </Link>
          </div>
        }
      />

      {incident?.status === "OPEN" ? (
        <p className="rounded-xl border border-khet-cream bg-khet-cream px-4 py-3 text-sm">
          An operational incident is open on the Igatpuri demonstration
          shipment.{" "}
          <Link
            className="font-semibold text-khet-green"
            href={`/incidents/${incident.id}`}
          >
            Open that record
          </Link>
          . The map below is the canonical Nashik route.
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-khet-line p-5">
          <p className="text-sm text-khet-muted">Harvest ready</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {formatKg(crop.quantityKg)}
          </p>
          <p className="mt-1 text-sm text-khet-muted">
            {crop.name} · {crop.originName}
          </p>
        </article>
        <article className="rounded-2xl border border-khet-line p-5">
          <p className="text-sm text-khet-muted">Feasible destinations</p>
          <p className="mt-2 text-4xl font-bold">{plans.length} markets</p>
          <p className="mt-1 text-sm text-khet-muted">
            {plans.map((plan) => plan.destination.replace(" APMC", "")).join(" · ")}
          </p>
        </article>
        <article className="rounded-2xl border border-[#ead9a4] bg-khet-cream p-5">
          <p className="text-sm text-[#8a5a18]">Next step</p>
          <p className="mt-2 text-3xl font-bold">Choose a plan</p>
          <p className="mt-1 text-sm text-khet-muted">
            Compare route, capacity and modeled proceeds
          </p>
        </article>
      </section>

      <JourneyMap points={route.points} lines={route.lines}>
        <div className="absolute left-4 top-4 max-w-[14rem] rounded-xl bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold">Shipment route</p>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <span className="h-1 w-6 rounded bg-khet-green" />
            Pimpalgaon → Vashi
          </p>
          <p className="mt-1 text-xs text-khet-muted">
            {route.distanceKm} km · {route.stops.length - 1} route legs
          </p>
        </div>
        <div className="absolute bottom-10 left-4 max-w-[14rem] rounded-xl bg-white p-3 shadow-sm">
          <p className="text-sm font-bold">{crop.name}</p>
          <p className="text-sm text-khet-muted">
            {formatKg(crop.quantityKg)} · Standard 10-T truck
          </p>
        </div>
      </JourneyMap>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ready for planning</h2>
          <p className="mt-1 text-sm text-khet-muted">
            {crop.name} · Grade {crop.grade} at dispatch · Demo lot KS-024
          </p>
        </div>
        <Link
          href="/plans"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-khet-green px-4 text-sm font-semibold text-white hover:bg-khet-greenDark"
        >
          Compare plans →
        </Link>
      </div>
    </div>
  );
}
