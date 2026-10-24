import type baselineDocument from "@/data/demo-baseline.json";
import {
  byId,
  evaluateScenario,
  prefixCostInr,
} from "@/scripts/reference-model.mjs";

type ScenarioResult = ReturnType<typeof evaluateScenario>;

export interface ScenarioCostBreakdown {
  dispatch: number;
  transport: number;
  loading: number;
  intervention: number;
  storage: number;
  detention: number;
  unloading: number;
  marketFees: number;
}

function readCostBreakdown(
  source: Record<string, number>
): ScenarioCostBreakdown {
  return {
    dispatch: source.dispatch ?? 0,
    transport: source.transport ?? 0,
    loading: source.loading ?? 0,
    intervention: source.intervention ?? 0,
    storage: source.storage ?? 0,
    detention: source.detention ?? 0,
    unloading: source.unloading ?? 0,
    marketFees: source.marketFees ?? 0,
  };
}

/**
 * Compares two branches of the canonical fixture calculator.
 * It does not keep a second price, spoilage, or cost formula.
 * Currency is rounded to 2 decimal INR inside that calculator, and the
 * delta is rounded the same way after subtraction. Identical rounded nets
 * therefore differ by 0. JavaScript numbers do not preserve trailing zeros.
 */
export const COUNTERFACTUAL_DOMAIN_STATUS = "IMPLEMENTED" as const;

export const COUNTERFACTUAL_ROUNDING_POLICY =
  "Each cost line is rounded to 2 decimal INR. For the registered scenarios those lines add up to the displayed logistics total. The reference net is rounded from unrounded gross minus unrounded costs, so it can differ by one paise from displayed gross minus displayed logistics. The delta uses the reference nets. Identical reference nets produce 0.";

export type DemoBaseline = typeof baselineDocument;

export class CounterfactualError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CounterfactualError";
  }
}

export interface CounterfactualBranch {
  scenarioId: string;
  marketId: string;
  deliveredKg: number;
  qualityFraction: number;
  grade: string;
  grossProceedsInr: number;
  logisticsCostInr: number;
  interventionCostInr: number;
  netProceedsInr: number;
  costBreakdownInr: ScenarioCostBreakdown;
}

export interface CounterfactualComparison {
  status: "SIMULATED";
  isSimulatedData: true;
  recoveryScenarioId: string;
  noActionScenarioId: string;
  recoveryBranch: CounterfactualBranch;
  noActionBranch: CounterfactualBranch;
  counterfactualDeltaInr: number;
  sharedPrefixSteps: number;
  sharedPreIncidentCostInr: number;
  roundingPolicy: string;
  assumptions: string[];
  limitations: string[];
}

export interface CompareBranchesInput {
  baseline: DemoBaseline;
  recoveryScenarioId: string;
  noActionScenarioId: string;
}

const LIMITATIONS = [
  "Prices, decay, capacities, and fees are synthetic demonstration assumptions from the selected baseline.",
  "The delta is a modeled estimate. It is not proven farmer income, a completed sale, or guaranteed savings.",
  "Plan cards use the planning catalog, including a ventilated rate of ₹72/km. This comparison uses the baseline vehicle register, including ventilated ₹38/km and a ₹2,800 fixed dispatch.",
  "Excluded externalities include live market movement, road conditions, carrier performance, and payment realization.",
  "A stored shipment status is a separate fact. This comparison does not change it and does not reconstruct that shipment.",
];

function requireScenarioId(value: string, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CounterfactualError(`${label} is required.`);
  }
  return value;
}

function sameStep(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sharedPrefixSteps(
  recovery: { steps: readonly unknown[] },
  noAction: { steps: readonly unknown[] }
): number {
  let count = 0;
  const limit = Math.min(recovery.steps.length, noAction.steps.length);
  while (
    count < limit &&
    sameStep(recovery.steps[count], noAction.steps[count])
  ) {
    count += 1;
  }
  return count;
}

function toBranch(result: ScenarioResult): CounterfactualBranch {
  return {
    scenarioId: result.id,
    marketId: result.marketId,
    deliveredKg: result.saleableKg,
    qualityFraction: result.qualityFraction,
    grade: result.grade,
    grossProceedsInr: result.grossProceedsInr,
    logisticsCostInr: result.totalCostsInr,
    interventionCostInr: result.interventionCostInr,
    netProceedsInr: result.netProceedsInr,
    costBreakdownInr: readCostBreakdown(result.costBreakdownInr),
  };
}

export function compareBranches(
  input: CompareBranchesInput
): CounterfactualComparison {
  if (!input?.baseline || !Array.isArray(input.baseline.scenarios)) {
    throw new CounterfactualError(
      "A baseline with registered scenarios is required."
    );
  }
  const recoveryScenarioId = requireScenarioId(
    input.recoveryScenarioId,
    "Recovery scenario"
  );
  const noActionScenarioId = requireScenarioId(
    input.noActionScenarioId,
    "No-action scenario"
  );
  const recoveryScenario = input.baseline.scenarios.find(
    (scenario) => scenario.id === recoveryScenarioId
  );
  const noActionScenario = input.baseline.scenarios.find(
    (scenario) => scenario.id === noActionScenarioId
  );
  if (!recoveryScenario || !noActionScenario) {
    throw new CounterfactualError(
      "Both branches must name scenarios in the supplied baseline."
    );
  }

  let recovery: ScenarioResult;
  let noAction: ScenarioResult;
  try {
    recovery = evaluateScenario(input.baseline, recoveryScenario);
    noAction = evaluateScenario(input.baseline, noActionScenario);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The scenario could not be priced.";
    throw new CounterfactualError(message);
  }

  const prefix = sharedPrefixSteps(recoveryScenario, noActionScenario);
  const recoveryPrefix = prefixCostInr(
    input.baseline,
    recoveryScenario,
    prefix
  );
  const noActionPrefix = prefixCostInr(
    input.baseline,
    noActionScenario,
    prefix
  );
  if (recoveryPrefix !== noActionPrefix) {
    throw new CounterfactualError(
      "Shared opening steps produced different costs. The branches are not comparable."
    );
  }

  return {
    status: "SIMULATED",
    isSimulatedData: true,
    recoveryScenarioId,
    noActionScenarioId,
    recoveryBranch: toBranch(recovery),
    noActionBranch: toBranch(noAction),
    counterfactualDeltaInr: Number(
      (recovery.netProceedsInr - noAction.netProceedsInr).toFixed(2)
    ),
    sharedPrefixSteps: prefix,
    sharedPreIncidentCostInr: recoveryPrefix,
    roundingPolicy: COUNTERFACTUAL_ROUNDING_POLICY,
    assumptions: [
      "Both branches use the same crop quantity, quality curve, vehicle register, and price list from the supplied baseline.",
      "Costs already incurred on identical opening steps are the shared pre-incident cost.",
      byId(input.baseline.scenarios, recoveryScenarioId).description,
      byId(input.baseline.scenarios, noActionScenarioId).description,
    ],
    limitations: LIMITATIONS,
  };
}
