import baseline from "@/data/demo-baseline.json";
import type { ShipmentReport } from "@/lib/contracts/report.contract";
import {
  compareBranches,
  type CounterfactualComparison,
} from "@/lib/domain/counterfactual";

export interface ShipmentReportSource {
  shipmentId: string;
  status: string;
}

export const CANONICAL_RECOVERY_SCENARIO_ID = "alternative-recovery";
export const CANONICAL_NO_ACTION_SCENARIO_ID = "no-action";

/**
 * The stored shipment does not record a baseline scenario id.
 * Every report therefore publishes the same registered pair and says so.
 * The persisted status is copied through unchanged.
 */
export function canonicalComparison(): CounterfactualComparison {
  return compareBranches({
    baseline,
    recoveryScenarioId: CANONICAL_RECOVERY_SCENARIO_ID,
    noActionScenarioId: CANONICAL_NO_ACTION_SCENARIO_ID,
  });
}

export function financialModelFromComparison(
  comparison: CounterfactualComparison
): ShipmentReport["financialModel"] {
  return {
    modelScope: "canonical-baseline",
    recoveryScenarioId: comparison.recoveryScenarioId,
    noActionScenarioId: comparison.noActionScenarioId,
    sharedPrefixSteps: comparison.sharedPrefixSteps,
    sharedPreIncidentCostInr: comparison.sharedPreIncidentCostInr,
    roundingPolicy: comparison.roundingPolicy,
    assumptions: comparison.assumptions,
    limitations: comparison.limitations,
    recoveryBranch: comparison.recoveryBranch,
    noActionBranch: comparison.noActionBranch,
    counterfactualDeltaInr: comparison.counterfactualDeltaInr,
  };
}

export async function baselineReportModel(): Promise<
  ShipmentReport["financialModel"]
> {
  return financialModelFromComparison(canonicalComparison());
}

export async function shipmentReportEnvelope(
  source: ShipmentReportSource
): Promise<ShipmentReport> {
  return {
    reportId: `rep_${source.shipmentId}`,
    shipmentId: source.shipmentId,
    status: source.status,
    isSimulatedData: true,
    financialModel: await baselineReportModel(),
  };
}
