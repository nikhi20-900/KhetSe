"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import type {
  ControlIncidentId,
  ControlRoomPreview,
  RecoveryOptionView,
} from "@/lib/domain/simulation-control-room";

function formatInr(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatHours(value: number) {
  return `${value.toFixed(2)} h`;
}

export function ControlRoom({ preview }: { preview: ControlRoomPreview }) {
  const [incidentId, setIncidentId] = useState<ControlIncidentId>("breakdown");
  const [choiceId, setChoiceId] = useState<RecoveryOptionView["id"]>("reroute");
  const [running, setRunning] = useState(false);
  const [virtualTime, setVirtualTime] = useState(0);
  const incident =
    preview.incidents.find((item) => item.id === incidentId) ??
    preview.incidents[0];
  const selected =
    incident?.options.find((option) => option.id === choiceId) ??
    incident?.options[0];
  const end = selected?.completionHours ?? 0;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setVirtualTime((current) => {
        const next = Number((current + 0.5).toFixed(1));
        if (next >= end) {
          setRunning(false);
          return end;
        }
        return next;
      });
    }, 200);
    return () => window.clearInterval(timer);
  }, [running, end]);

  if (!incident || !selected) return null;

  const milestones = [
    { id: "created", label: "Shipment created", hours: 0 },
    { id: "dispatched", label: "Dispatched", hours: 0 },
    { id: "transit", label: "In transit", hours: 0 },
    ...(incident.incidentHours === null
      ? []
      : [
          {
            id: "incident",
            label: "Incident detected",
            hours: incident.incidentHours,
          },
          {
            id: "decision",
            label: "Recovery decision preview",
            hours: incident.incidentHours,
          },
        ]),
    ...(selected.arrivalHours === null
      ? []
      : [
          {
            id: "arrival",
            label: "Estimated arrival",
            hours: selected.arrivalHours,
          },
        ]),
    ...(selected.completionHours === null
      ? []
      : [
          {
            id: "delivery",
            label: "Estimated completion",
            hours: selected.completionHours,
          },
        ]),
  ];
  const remaining = Math.max(0, end - virtualTime);
  const delay =
    incident.id === "delay"
      ? preview.delayHours
      : incident.id === "temperature"
        ? 24 + preview.temperatureExcursionHours
        : incident.id === "breakdown" && choiceId === "no-action"
          ? 48
          : incident.id === "breakdown"
            ? 24
            : 0;
  const barMax = Math.max(
    1,
    Math.abs(selected.netProceedsInr ?? 0),
    Math.abs(selected.comparisonNetProceedsInr ?? 0)
  );

  function inject(next: ControlIncidentId) {
    setIncidentId(next);
    setRunning(false);
    const hours =
      preview.incidents.find((item) => item.id === next)?.incidentHours ?? 0;
    setVirtualTime(hours);
  }

  function reset() {
    setIncidentId("breakdown");
    setChoiceId("reroute");
    setRunning(false);
    setVirtualTime(0);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="SIMULATION LAB · IN MEMORY"
        title="Simulation Lab"
        description="Configure the registered onion lot, advance simulated time, and preview repair, reroute, or no action. Modeled amounts are estimates. This screen does not change a stored shipment or reservation."
        badge={<Badge tone="gray">SIMULATED</Badge>}
      />

      <Card
        header={
          <h2 className="font-semibold text-charcoal-950">Shipment setup</h2>
        }
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          method="get"
          action="/simulation"
        >
          <label className="block text-sm">
            <span className="font-semibold">Crop</span>
            <input
              className="mt-1 w-full rounded-md border border-sand-400 px-3 py-2"
              name="cropType"
              defaultValue={preview.cropType}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Quantity (kg)</span>
            <input
              className="mt-1 w-full rounded-md border border-sand-400 px-3 py-2"
              name="quantityKg"
              inputMode="numeric"
              defaultValue={String(preview.quantityKg)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Origin</span>
            <select
              className="mt-1 w-full rounded-md border border-sand-400 px-3 py-2"
              name="originId"
              defaultValue={preview.originId}
            >
              <option value="pimpalgaon">{preview.originName}</option>
              <option value="surat">Surat (unsupported)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Destination</span>
            <select
              className="mt-1 w-full rounded-md border border-sand-400 px-3 py-2"
              name="destinationId"
              defaultValue={preview.destinationId}
            >
              <option value="pune">Pune APMC, Gultekdi</option>
              <option value="vashi">Vashi APMC Mumbai</option>
              <option value="surat">Surat (unsupported)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Initial truck</span>
            <select
              className="mt-1 w-full rounded-md border border-sand-400 px-3 py-2"
              name="vehicleId"
              defaultValue={preview.vehicleId}
            >
              <option value="standard-10t">Standard 10-T truck</option>
              <option value="ventilated-10t">
                Ventilated truck (unsupported as the initial truck)
              </option>
              <option value="reefer-van">
                Reefer van (unsupported as the initial truck)
              </option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Igatpuri delay (hours)</span>
            <input
              className="mt-1 w-full rounded-md border border-sand-400 px-3 py-2"
              name="delayHours"
              inputMode="numeric"
              defaultValue={String(preview.delayHours)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold">
              Extra stalled-hot hours for a temperature excursion
            </span>
            <input
              className="mt-1 w-full max-w-xs rounded-md border border-sand-400 px-3 py-2"
              name="temperatureExcursionHours"
              inputMode="numeric"
              defaultValue={String(preview.temperatureExcursionHours)}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              className="rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white"
              type="submit"
            >
              Apply setup
            </button>
            <p className="mt-2 text-sm text-charcoal-600">
              Default lot: 10,000 kg Nashik Red Onion from {preview.originName}.
              The registered repair and no-action routes end at Vashi. The
              Nashik cold-storage reroute ends at Pune. Temperature is modeled
              only as extra stalled-hot time, not as a live reading.
            </p>
          </div>
        </form>
      </Card>

      <Card
        header={
          <h2 className="font-semibold text-charcoal-950">
            Simulated timeline
          </h2>
        }
      >
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-sand-400 px-3 py-2 text-sm"
            type="button"
            onClick={() => setRunning(true)}
            disabled={!selected.feasible || virtualTime >= end}
          >
            {virtualTime > 0 && !running ? "Resume" : "Start"}
          </button>
          <button
            className="rounded-md border border-sand-400 px-3 py-2 text-sm"
            type="button"
            onClick={() => setRunning(false)}
            disabled={!running}
          >
            Pause
          </button>
          <button
            className="rounded-md border border-sand-400 px-3 py-2 text-sm"
            type="button"
            onClick={reset}
          >
            Reset simulation
          </button>
        </div>
        <p className="mt-3 text-sm text-charcoal-800" role="status">
          Simulated time {formatHours(virtualTime)}. State:{" "}
          {milestones.filter((step) => virtualTime >= step.hours).at(-1)
            ?.label ?? "Not started"}
          . Estimated delay {delay} h. Remaining journey{" "}
          {formatHours(remaining)}. Playback does not change the calculated
          amounts.
        </p>
        <ol className="mt-4 space-y-2">
          {milestones.map((step) => {
            const reached = virtualTime >= step.hours;
            return (
              <li
                key={step.id}
                className={`rounded-md border px-3 py-2 text-sm ${
                  reached
                    ? "border-sage-600 bg-sage-50 text-charcoal-950"
                    : "border-sand-300 text-charcoal-600"
                }`}
              >
                {step.label} · {formatHours(step.hours)}
              </li>
            );
          })}
        </ol>
      </Card>

      <Card
        header={
          <h2 className="font-semibold text-charcoal-950">
            Disruption controls
          </h2>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {preview.incidents.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                item.id === incidentId
                  ? "border-terracotta bg-terracotta-50"
                  : "border-sand-300"
              }`}
              onClick={() => inject(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-charcoal-700">{incident.detail}</p>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-charcoal-950">
          Recovery preview
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {incident.options.map((option) => (
            <Card key={option.id}>
              <h3 className="font-semibold text-charcoal-950">
                {option.title}
              </h3>
              <p className="mt-2 text-sm text-charcoal-700">
                {option.feasible
                  ? `Ends at ${option.destinationLabel}.`
                  : option.unsupportedReason}
              </p>
              {option.feasible ? (
                <p className="mt-2 text-sm">
                  Net {formatInr(option.netProceedsInr ?? 0)}. Arrival{" "}
                  {formatHours(option.arrivalHours ?? 0)}. Storage{" "}
                  {formatInr(option.storageCostInr ?? 0)}.
                </p>
              ) : null}
              <p className="mt-2 text-sm text-charcoal-600">
                {option.approvalNote}
              </p>
              <button
                className="mt-3 rounded-md bg-charcoal px-3 py-2 text-sm text-linen disabled:opacity-50"
                type="button"
                disabled={!option.feasible}
                onClick={() => setChoiceId(option.id)}
              >
                {choiceId === option.id
                  ? "Preview selected"
                  : "Preview this path"}
              </button>
            </Card>
          ))}
        </div>
        <p className="text-sm text-charcoal-700">
          {preview.storage.vashiReason} {preview.storage.nashikReason}
        </p>
      </section>

      <Card
        header={
          <h2 className="font-semibold text-charcoal-950">
            Outcome comparison
          </h2>
        }
      >
        {selected.feasible && selected.deltaInr !== null ? (
          <div className="space-y-3 text-sm text-charcoal-800">
            <p data-persisted="false">{preview.persistenceNote}</p>
            <p>{selected.deltaReading}</p>
            <p>
              Recovery delta {formatInr(selected.deltaInr)}. Selected net{" "}
              {formatInr(selected.netProceedsInr ?? 0)}. Comparison net{" "}
              {formatInr(selected.comparisonNetProceedsInr ?? 0)}.
            </p>
            <div className="space-y-2">
              <Bar
                label="Selected preview"
                value={selected.netProceedsInr ?? 0}
                max={barMax}
              />
              <Bar
                label="Comparison branch"
                value={selected.comparisonNetProceedsInr ?? 0}
                max={barMax}
              />
            </div>
            <p>
              Delivered {selected.deliveredKg ?? 0} kg. Gross{" "}
              {formatInr(selected.grossProceedsInr ?? 0)}. Logistics{" "}
              {formatInr(selected.logisticsCostInr ?? 0)}. Shared opening cost{" "}
              {formatInr(selected.sharedPreIncidentCostInr ?? 0)}.
            </p>
            <ul className="space-y-1">
              {selected.lines.map((line) => (
                <li key={line.component}>
                  {line.component}: {formatInr(line.amountInr)} · {line.meaning}
                </li>
              ))}
            </ul>
            <p>{selected.spoilageNote}</p>
          </div>
        ) : (
          <p role="alert" className="text-sm text-terracotta-800">
            {selected.unsupportedReason} No financial result was invented for
            this path.
          </p>
        )}
        <ul className="mt-4 space-y-1 text-sm text-charcoal-600">
          {preview.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = `${Math.max(2, (Math.abs(value) / max) * 100)}%`;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span>{formatInr(value)}</span>
      </div>
      <div className="h-3 rounded bg-sand-200">
        <div
          className={`h-3 rounded ${value < 0 ? "bg-terracotta" : "bg-sage-600"}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}
