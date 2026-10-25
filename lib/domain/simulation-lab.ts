import baselineDocument from "@/data/demo-baseline.json";
import {
  compareBranches,
  type CounterfactualComparison,
  type DemoBaseline,
} from "@/lib/domain/counterfactual";
import {
  itemizeModeledBranch,
  type ItemizedModeledCost,
} from "@/lib/domain/financials";
import { evaluateScenario } from "@/scripts/reference-model.mjs";

/**
 * In-memory repricing of registered baseline scenarios.
 * This module does not import the database client or call an API.
 */
export const SIMULATION_LAB_STATUS = "IN_MEMORY_ONLY" as const;

export const SIMULATION_LAB_PERSISTENCE_NOTE =
  "This recalculation stays in memory. It does not create or change a shipment or reservation.";

export class SimulationLabError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationLabError";
  }
}

export type DisruptionId = "none" | "breakdown" | "delay";
export type ResponseId =
  | "planned"
  | "repair"
  | "cold-recovery"
  | "no-action"
  | "negative-recovery"
  | "delayed-continuation";

export interface SimulationLabChoice {
  disruptionId: DisruptionId;
  responseId: ResponseId;
  recoveryScenarioId: string;
  comparisonScenarioId: string;
  disruptionLabel: string;
  responseLabel: string;
  comparisonLabel: string;
}

export const SIMULATION_LAB_CHOICES: readonly SimulationLabChoice[] = [
  {
    disruptionId: "none",
    responseId: "planned",
    recoveryScenarioId: "normal-delivery",
    comparisonScenarioId: "normal-delivery",
    disruptionLabel: "No disruption",
    responseLabel: "Follow the undisrupted Vashi route",
    comparisonLabel: "The same undisrupted route",
  },
  {
    disruptionId: "breakdown",
    responseId: "repair",
    recoveryScenarioId: "vehicle-breakdown",
    comparisonScenarioId: "no-action",
    disruptionLabel: "Breakdown after Nashik",
    responseLabel: "Pay for repair and continue to Vashi",
    comparisonLabel: "No paid intervention, then continue",
  },
  {
    disruptionId: "breakdown",
    responseId: "cold-recovery",
    recoveryScenarioId: "alternative-recovery",
    comparisonScenarioId: "no-action",
    disruptionLabel: "Breakdown after Nashik",
    responseLabel: "Ventilated truck and Nashik cold storage",
    comparisonLabel: "No paid intervention, then continue",
  },
  {
    disruptionId: "breakdown",
    responseId: "no-action",
    recoveryScenarioId: "no-action",
    comparisonScenarioId: "no-action",
    disruptionLabel: "Breakdown after Nashik",
    responseLabel: "No action",
    comparisonLabel: "The same no-action branch",
  },
  {
    disruptionId: "breakdown",
    responseId: "negative-recovery",
    recoveryScenarioId: "negative-recovery",
    comparisonScenarioId: "no-action",
    disruptionLabel: "Breakdown after Nashik",
    responseLabel: "Expensive reefer intervention",
    comparisonLabel: "No paid intervention, then continue",
  },
  {
    disruptionId: "delay",
    responseId: "delayed-continuation",
    recoveryScenarioId: "transit-delay",
    comparisonScenarioId: "normal-delivery",
    disruptionLabel: "Delay at Igatpuri",
    responseLabel: "Wait out the delay and continue",
    comparisonLabel: "The undisrupted Vashi route",
  },
];

export interface SimulationLabInput {
  disruptionId: DisruptionId;
  responseId: ResponseId;
  repairPauseHours?: number;
  delayPauseHours?: number;
  recoverySurchargeInr?: number;
  quantityKg?: number;
}

export interface SimulationLabResult {
  status: "SIMULATED";
  persisted: false;
  disruptionId: DisruptionId;
  responseId: ResponseId;
  recoveryScenarioId: string;
  comparisonScenarioId: string;
  disruptionLabel: string;
  responseLabel: string;
  comparisonLabel: string;
  comparison: CounterfactualComparison;
  selectedLines: ItemizedModeledCost[];
  comparisonLines: ItemizedModeledCost[];
  arrivalHours: number;
  completionHours: number;
  effectiveAgeHours: number;
  persistenceNote: string;
}

export function responsesFor(disruptionId: DisruptionId) {
  return SIMULATION_LAB_CHOICES.filter(
    (choice) => choice.disruptionId === disruptionId
  );
}

function requireChoice(input: SimulationLabInput) {
  const choice = SIMULATION_LAB_CHOICES.find(
    (item) =>
      item.disruptionId === input.disruptionId &&
      item.responseId === input.responseId
  );
  if (!choice) {
    throw new SimulationLabError(
      "That disruption and response are not a registered comparison."
    );
  }
  return choice;
}

function requirePause(value: number, label: string, max: number) {
  if (!Number.isFinite(value) || value < 0 || value > max) {
    throw new SimulationLabError(
      `${label} must be a finite duration from 0 to ${max} hours.`
    );
  }
}

function requireQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 10_000) {
    throw new SimulationLabError(
      "Quantity must be a whole number of kilograms from 1 to 10000."
    );
  }
}

function requireSurcharge(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 300_000) {
    throw new SimulationLabError(
      "Recovery surcharge must be a whole number of rupees from 0 to 300000."
    );
  }
}

function baselineWithOverrides(
  choice: SimulationLabChoice,
  input: SimulationLabInput
): DemoBaseline {
  if (input.repairPauseHours !== undefined && choice.responseId !== "repair") {
    throw new SimulationLabError(
      "Repair pause applies only to the paid repair response."
    );
  }
  if (
    input.delayPauseHours !== undefined &&
    choice.responseId !== "delayed-continuation"
  ) {
    throw new SimulationLabError(
      "Delay duration applies only to the Igatpuri delay response."
    );
  }
  if (input.quantityKg !== undefined) requireQuantity(input.quantityKg);
  if (
    input.recoverySurchargeInr !== undefined &&
    choice.responseId !== "cold-recovery" &&
    choice.responseId !== "negative-recovery"
  ) {
    throw new SimulationLabError(
      "Recovery surcharge applies only to a recovery response."
    );
  }
  const copy = structuredClone(baselineDocument);
  if (input.quantityKg !== undefined) {
    copy.crop.quantityKg = input.quantityKg;
  }
  if (input.repairPauseHours !== undefined) {
    requirePause(input.repairPauseHours, "Repair pause", 48);
    const scenario = copy.scenarios.find(
      (item) => item.id === choice.recoveryScenarioId
    );
    const pause = scenario?.steps.find((step) => step.type === "pause");
    if (!pause || !("durationHours" in pause)) {
      throw new SimulationLabError(
        "The repair scenario has no pause to change."
      );
    }
    pause.durationHours = input.repairPauseHours;
  }
  if (input.delayPauseHours !== undefined) {
    requirePause(input.delayPauseHours, "Delay duration", 24);
    const scenario = copy.scenarios.find(
      (item) => item.id === choice.recoveryScenarioId
    );
    const pause = scenario?.steps.find((step) => step.type === "pause");
    if (!pause || !("durationHours" in pause)) {
      throw new SimulationLabError(
        "The delay scenario has no pause to change."
      );
    }
    pause.durationHours = input.delayPauseHours;
  }
  if (input.recoverySurchargeInr !== undefined) {
    requireSurcharge(input.recoverySurchargeInr);
    const scenario = copy.scenarios.find(
      (item) => item.id === choice.recoveryScenarioId
    );
    const replacement = scenario?.steps.find(
      (step) =>
        step.type === "dispatch" &&
        "vehicleId" in step &&
        step.vehicleId !== "standard-10t"
    );
    if (!replacement || !("surchargeInr" in replacement)) {
      throw new SimulationLabError(
        "The recovery scenario has no replacement dispatch to reprice."
      );
    }
    replacement.surchargeInr = input.recoverySurchargeInr;
  }
  return copy;
}

export function evaluateSimulationLab(
  input: SimulationLabInput
): SimulationLabResult {
  const choice = requireChoice(input);
  const baseline = baselineWithOverrides(choice, input);
  const comparison = compareBranches({
    baseline,
    recoveryScenarioId: choice.recoveryScenarioId,
    noActionScenarioId: choice.comparisonScenarioId,
  });
  const scenario = baseline.scenarios.find(
    (item) => item.id === choice.recoveryScenarioId
  );
  if (!scenario) {
    throw new SimulationLabError(
      "The selected scenario is not in the baseline."
    );
  }
  const timed = evaluateScenario(baseline, scenario) as {
    arrivalHours: number;
    completionHours: number;
    effectiveAgeHours: number;
  };
  return {
    status: "SIMULATED",
    persisted: false,
    disruptionId: choice.disruptionId,
    responseId: choice.responseId,
    recoveryScenarioId: choice.recoveryScenarioId,
    comparisonScenarioId: choice.comparisonScenarioId,
    disruptionLabel: choice.disruptionLabel,
    responseLabel: choice.responseLabel,
    comparisonLabel: choice.comparisonLabel,
    comparison,
    selectedLines: itemizeModeledBranch(comparison.recoveryBranch),
    comparisonLines: itemizeModeledBranch(comparison.noActionBranch),
    arrivalHours: timed.arrivalHours,
    completionHours: timed.completionHours,
    effectiveAgeHours: timed.effectiveAgeHours,
    persistenceNote: SIMULATION_LAB_PERSISTENCE_NOTE,
  };
}
