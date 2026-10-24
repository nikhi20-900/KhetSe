"use client";

import { useEffect, useRef, useState } from "react";

import { Simulation, type Disruption } from "@/lib/domain/simulation";

function createSimulation(scenario = "normal") {
  const disruptions: Disruption[] =
    scenario === "normal"
      ? []
      : [
          {
            id: "demo-disruption",
            kind: scenario === "breakdown" ? "breakdown" : "delay",
            durationHours: scenario === "breakdown" ? 24 : 10,
            trigger: {
              checkpoint: scenario === "breakdown" ? "nashik" : "igatpuri",
            },
          },
        ];
  const simulation = new Simulation({
    plan: {
      routeId: "primary-vashi",
      vehicleId: "standard-10t",
      vehicleCount: 1,
      quantityKg: 10000,
    },
    seed: 42,
    disruptions,
  });
  simulation.setSpeed(3600);
  return simulation;
}

export function TransitClock() {
  const engine = useRef<Simulation | null>(null);
  const [state, setState] = useState(() => createSimulation().state);
  const [events, setEvents] = useState<Simulation["history"]>([]);
  const [scenario, setScenario] = useState("normal");
  const [speed, setSpeed] = useState(3600);
  function refresh() {
    if (!engine.current) return;
    setState(engine.current.state);
    setEvents(
      engine.current.history.filter(
        (event) =>
          event.type !== "TRANSIT_TICK" && event.type !== "QUALITY_DECAY"
      )
    );
  }
  useEffect(() => {
    engine.current = createSimulation();
    const timer = window.setInterval(() => {
      engine.current?.elapse(0.1);
      refresh();
    }, 100);
    return () => window.clearInterval(timer);
  }, []);
  function reset(value: string) {
    setScenario(value);
    engine.current = createSimulation(value);
    engine.current.setSpeed(speed);
    refresh();
  }
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold">Transit simulation</h2>
      <p>
        SIMULATED · Seed 42 · 10,000 kg Nashik Red Onion · Standard truck to
        Vashi. Times are hours since dispatch. This clock stays in the browser.
        It does not write a shipment or reservation.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label>
          Scenario{" "}
          <select
            className="rounded border p-2 text-black"
            value={scenario}
            onChange={(event) => reset(event.target.value)}
          >
            <option value="normal">Normal delivery</option>
            <option value="delay">Delay at Igatpuri</option>
            <option value="breakdown">Breakdown at Nashik</option>
          </select>
        </label>
        <label>
          Speed{" "}
          <select
            className="rounded border p-2 text-black"
            value={speed}
            onChange={(event) => {
              const value = Number(event.target.value);
              setSpeed(value);
              engine.current?.setSpeed(value);
            }}
          >
            <option value={60}>1 minute / second</option>
            <option value={3600}>1 hour / second</option>
            <option value={14400}>4 hours / second</option>
          </select>
        </label>
        <button
          className="rounded border px-3 py-2"
          disabled={state.finished}
          onClick={() => {
            if (state.paused) engine.current?.play();
            else engine.current?.pause();
            refresh();
          }}
        >
          {state.paused ? "Play" : "Pause"}
        </button>
        <button
          className="rounded border px-3 py-2"
          disabled={state.finished || !state.paused}
          onClick={() => {
            engine.current?.step();
            refresh();
          }}
        >
          Step event
        </button>
        <button
          className="rounded border px-3 py-2"
          onClick={() => reset(scenario)}
        >
          Reset
        </button>
      </div>
      <p role="status">
        {state.finished ? "Arrived" : state.paused ? "Paused" : "Playing"} ·{" "}
        {state.virtualTime.toFixed(2)} h · {state.location} ·{" "}
        {state.environment}
      </p>
      <p>
        Quality: {(state.quality.qualityFraction * 100).toFixed(2)}% · Grade{" "}
        {state.quality.grade} · Remaining reference shelf life:{" "}
        {state.quality.referenceShelfLifeRemainingHours.toFixed(2)} h
      </p>
      <h2 className="text-xl font-semibold">Event history</h2>
      <ol className="space-y-2">
        {events.map((event) => (
          <li key={event.id}>
            {event.time.toFixed(2)} h — {event.type}{" "}
            {event.checkpoint ?? event.disruption?.kind} — quality{" "}
            {(event.quality.qualityFraction * 100).toFixed(2)}%
          </li>
        ))}
      </ol>
    </section>
  );
}
