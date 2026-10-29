"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Simulation } from "@/lib/domain/simulation";
import { addHours, formatClock, formatHourCount } from "@/lib/demo/clock";

const SPEEDS = [
  { id: "10", label: "10×", hoursPerSecond: 10 / 60 },
  { id: "60", label: "60×", hoursPerSecond: 1 },
  { id: "360", label: "360×", hoursPerSecond: 6 },
];

export function ShipmentMonitor({
  routeId,
  quantityKg,
  transitHours,
  completionHours,
  dispatchAt,
  stops,
  disruptionHref,
  reportHref,
  completionNote,
}: {
  routeId: string;
  quantityKg: number;
  transitHours: number;
  completionHours: number;
  dispatchAt: string;
  stops: { id: string; label: string; atHours: number }[];
  disruptionHref: string;
  reportHref: string;
  completionNote: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedId, setSpeedId] = useState("10");
  const speed = SPEEDS.find((item) => item.id === speedId) ?? SPEEDS[0];
  const finished = elapsed >= completionHours - 0.01;

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setElapsed((current) => {
        const next = Math.min(
          completionHours,
          current + delta * speed.hoursPerSecond
        );
        if (next >= completionHours) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [completionHours, playing, speed.hoursPerSecond]);

  const sample = useMemo(() => {
    const simulation = new Simulation({
      plan: {
        routeId,
        vehicleId: "standard-10t",
        vehicleCount: 1,
        quantityKg,
      },
      seed: 42,
    });
    simulation.advanceTo(Math.min(Math.max(elapsed, 0), transitHours));
    return simulation.state;
  }, [elapsed, quantityKg, routeId, transitHours]);

  const next = stops.find(
    (stop) => stop.atHours > elapsed + 0.02 && stop.id !== stops[0]?.id
  );
  const here =
    stops.find((stop) => stop.id === sample.location)?.label ?? sample.location;
  const quality = sample.quality.qualityFraction.toFixed(2);
  const clockAt = (hours: number) =>
    formatClock(addHours(dispatchAt, hours).toISOString());
  const progress =
    completionHours > 0
      ? `${Math.min(100, (elapsed / completionHours) * 100)}%`
      : "0%";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-khet-line bg-white px-3 py-2.5 lg:flex-row lg:items-center">
        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-khet-mint px-3 text-sm font-medium text-khet-green"
          onClick={() => setPlaying((value) => !finished && !value)}
          aria-pressed={playing}
        >
          {finished
            ? "Simulation complete"
            : playing
              ? "Simulation playing"
              : "Simulation paused"}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="w-12 shrink-0 text-sm font-semibold tabular-nums leading-none">
            {clockAt(0).replace(" IST", "")}
          </span>
          <input
            className="khet-range min-w-0 flex-1"
            style={{ ["--progress" as string]: progress }}
            type="range"
            min={0}
            max={completionHours}
            step={0.05}
            value={Math.min(elapsed, completionHours)}
            aria-valuetext={`${formatHourCount(elapsed)} after dispatch`}
            aria-label="Shipment playback"
            onChange={(event) => {
              setPlaying(false);
              setElapsed(Number(event.target.value));
            }}
          />
          <span className="w-[5.5rem] shrink-0 text-right text-sm font-semibold tabular-nums leading-none">
            {clockAt(completionHours)}
          </span>
        </div>
        <label className="inline-flex h-9 shrink-0 items-center gap-2 text-sm leading-none text-khet-muted">
          Playback
          <select
            className="h-9 rounded-md border border-khet-line bg-white px-2 text-sm leading-none text-khet-ink"
            value={speedId}
            aria-label="Playback speed"
            onChange={(event) => setSpeedId(event.target.value)}
          >
            {SPEEDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <Link
          href={disruptionHref}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-khet-line px-4 text-sm font-semibold hover:bg-khet-sand"
        >
          Show disruption →
        </Link>
      </div>
      <p className="sr-only" aria-live="polite">
        {playing ? "Playback running" : "Playback paused"} at {here}. Modeled
        grade {sample.quality.grade}.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-khet-line p-5">
          <p className="text-sm text-khet-muted">Modeled quality</p>
          <p className="mt-2 text-3xl font-bold">Grade {sample.quality.grade}</p>
          <p className="mt-1 text-sm text-khet-muted">
            {quality} {elapsed <= 0.05 ? "at dispatch" : `near ${here}`}
          </p>
        </article>
        <article className="rounded-2xl border border-khet-line p-5">
          <p className="text-sm text-khet-muted">Expected completion</p>
          <p className="mt-2 text-3xl font-bold">{clockAt(completionHours)}</p>
          <p className="mt-1 text-sm text-khet-muted">{completionNote}</p>
        </article>
        <article className="rounded-2xl border border-khet-line p-5">
          <p className="text-sm text-khet-muted">Next checkpoint</p>
          <p className="mt-2 text-3xl font-bold">
            {finished ? "Complete" : (next?.label ?? here)}
          </p>
          <p className="mt-1 text-sm text-khet-muted">
            {next
              ? `${formatHourCount(Math.max(next.atHours - elapsed, 0))} from this point`
              : "Unloading is modeled after transit arrival"}
          </p>
        </article>
      </div>
      {finished ? (
        <Link
          href={reportHref}
          className="inline-flex min-h-11 items-center rounded-lg bg-khet-green px-4 text-sm font-semibold text-white"
        >
          Open shipment report →
        </Link>
      ) : null}
    </div>
  );
}
