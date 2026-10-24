import type { ShipmentReport } from "@/lib/contracts/report.contract";
import {
  byId,
  evaluateScenario,
  loadBaseline,
} from "@/scripts/reference-model.mjs";

export interface ShipmentReportSource {
  shipmentId: string;
  status: string;
}

/**
 * Financial rows are the canonical alternative-recovery and no-action
 * scenarios. Both start from the same breakdown in data/demo-baseline.json.
 * They are modeled estimates, not a completed sale.
 */
export async function baselineReportModel(): Promise<
  ShipmentReport["financialModel"]
> {
  const data = await loadBaseline();
  const recovery = evaluateScenario(
    data,
    byId(data.scenarios, "alternative-recovery")
  );
  const noAction = evaluateScenario(data, byId(data.scenarios, "no-action"));
  return {
    recoveryBranch: {
      deliveredKg: recovery.saleableKg,
      grossProceedsInr: recovery.grossProceedsInr,
      logisticsCostInr: recovery.totalCostsInr,
      netProceedsInr: recovery.netProceedsInr,
    },
    noActionBranch: {
      deliveredKg: noAction.saleableKg,
      grossProceedsInr: noAction.grossProceedsInr,
      logisticsCostInr: noAction.totalCostsInr,
      netProceedsInr: noAction.netProceedsInr,
    },
    counterfactualDeltaInr: Number(
      (recovery.netProceedsInr - noAction.netProceedsInr).toFixed(2)
    ),
  };
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
