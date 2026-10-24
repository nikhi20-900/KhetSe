import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ItemizedModeledCost } from "@/lib/domain/financials";
import {
  evaluateSimulationLab,
  responsesFor,
  SimulationLabError,
  SIMULATION_LAB_CHOICES,
  type DisruptionId,
  type ResponseId,
  type SimulationLabResult,
} from "@/lib/domain/simulation-lab";

const DISRUPTIONS: Array<{ id: DisruptionId; label: string }> = [
  { id: "none", label: "No disruption" },
  { id: "breakdown", label: "Breakdown after Nashik" },
  { id: "delay", label: "Delay at Igatpuri" },
];

function formatInr(value: number) {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `₹${formatted}`;
}

function Lines({ lines }: { lines: ItemizedModeledCost[] }) {
  return (
    <ul className="space-y-1 text-sm text-charcoal-800">
      {lines.map((line) => (
        <li key={line.component}>
          {line.component}: {formatInr(line.amountInr)} · {line.meaning}
        </li>
      ))}
    </ul>
  );
}

function ResultCard({ result }: { result: SimulationLabResult }) {
  return (
    <Card>
      <div className="space-y-4" data-persisted={String(result.persisted)}>
        <p className="text-sm text-charcoal-700">{result.persistenceNote}</p>
        <p className="text-sm text-charcoal-700">
          Selected response: {result.responseLabel}. Compared with{" "}
          {result.comparisonLabel}. Plan cards use the planning catalog,
          including ₹72/km. These figures use the baseline register, including
          ventilated ₹38/km.
        </p>
        <p role="status" className="text-base font-semibold text-charcoal-950">
          Reference delta {formatInr(result.comparison.counterfactualDeltaInr)}
        </p>
        <p className="text-sm">
          Selected net{" "}
          {formatInr(result.comparison.recoveryBranch.netProceedsInr)}.
          Comparison net{" "}
          {formatInr(result.comparison.noActionBranch.netProceedsInr)}.
        </p>
        <div>
          <h2 className="text-sm font-semibold text-charcoal-950">
            Selected cost lines
          </h2>
          <Lines lines={result.selectedLines} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-charcoal-950">
            Comparison cost lines
          </h2>
          <Lines lines={result.comparisonLines} />
        </div>
        <p className="text-sm text-charcoal-600">
          {result.comparison.roundingPolicy}
        </p>
      </div>
    </Card>
  );
}

export function SimulationLab({
  disruptionId,
  responseId,
  repairPauseHours,
  recoverySurchargeInr,
}: {
  disruptionId: DisruptionId;
  responseId: ResponseId;
  repairPauseHours?: number;
  recoverySurchargeInr?: number;
}) {
  const responses = responsesFor(disruptionId);
  let result: SimulationLabResult | null = null;
  let error: string | null = null;
  try {
    result = evaluateSimulationLab({
      disruptionId,
      responseId,
      repairPauseHours,
      recoverySurchargeInr,
    });
  } catch (caught) {
    error =
      caught instanceof SimulationLabError
        ? caught.message
        : "The scenarios could not be repriced.";
  }

  return (
    <section className="space-y-6" aria-labelledby="simulation-lab-title">
      <PageHeader
        kicker="SIMULATION LAB · IN MEMORY"
        title="Simulation Lab"
        description="Choose a registered disruption and response, then recalculate. The result uses the same comparison engine as the shipment report. Nothing on this screen is written to a shipment or reservation."
        badge={<Badge tone="gray">SIMULATED</Badge>}
      />
      <Card>
        <form className="space-y-4" method="get" action="/simulation">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-charcoal-950">
              Disruption
            </legend>
            {DISRUPTIONS.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="disruption"
                  value={item.id}
                  defaultChecked={disruptionId === item.id}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-charcoal-950">
              Response
            </legend>
            {SIMULATION_LAB_CHOICES.map((choice) => (
              <label
                key={`${choice.disruptionId}-${choice.responseId}`}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="response"
                  value={choice.responseId}
                  defaultChecked={responseId === choice.responseId}
                />
                {choice.disruptionLabel}: {choice.responseLabel}
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-charcoal-600">
            Responses shown for the current disruption:{" "}
            {responses.map((choice) => choice.responseLabel).join(", ")}.
          </p>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Repair pause (hours)</span>
            <input
              className="w-full max-w-xs rounded-md border border-sand-400 px-3 py-2"
              name="repairPauseHours"
              inputMode="decimal"
              defaultValue={
                repairPauseHours === undefined ? "" : String(repairPauseHours)
              }
            />
            <span className="block text-charcoal-600">
              Used only for the paid repair response. The registered pause is 24
              hours. Values from 0 to 48 reprice that pause.
            </span>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">
              Extra recovery surcharge (INR)
            </span>
            <input
              className="w-full max-w-xs rounded-md border border-sand-400 px-3 py-2"
              name="recoverySurchargeInr"
              inputMode="numeric"
              defaultValue={
                recoverySurchargeInr === undefined
                  ? ""
                  : String(recoverySurchargeInr)
              }
              placeholder="Blank keeps the registered surcharge"
            />
            <span className="block text-charcoal-600">
              Used only for a recovery response. A whole number from 0 to 300000
              replaces the registered replacement-dispatch surcharge.
            </span>
          </label>
          <button
            className="rounded-md bg-terracotta px-3.5 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Recalculate
          </button>
        </form>
      </Card>
      {error ? (
        <p role="alert" className="text-sm text-terracotta-800">
          {error}
        </p>
      ) : null}
      {result ? <ResultCard result={result} /> : null}
    </section>
  );
}
