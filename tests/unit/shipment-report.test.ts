import { describe, expect, it } from "vitest";

import {
  getShipmentReportRows,
  shipmentReportSchema,
} from "@/lib/contracts/report.contract";
import {
  baselineReportModel,
  shipmentReportEnvelope,
} from "@/lib/domain/shipment-report";
import {
  byId,
  evaluateScenario,
  loadBaseline,
} from "@/scripts/reference-model.mjs";

describe("shipment report envelope", () => {
  it("uses the canonical recovery and no-action results", async () => {
    const data = await loadBaseline();
    const ventilated = byId(data.vehicles, "ventilated-10t");
    expect(ventilated.rateInrPerKm).toBe(38);
    const recovery = evaluateScenario(
      data,
      byId(data.scenarios, "alternative-recovery")
    );
    const noAction = evaluateScenario(data, byId(data.scenarios, "no-action"));
    const model = await baselineReportModel();
    expect(model.modelScope).toBe("canonical-baseline");
    expect(model.recoveryBranch).toMatchObject({
      scenarioId: "alternative-recovery",
      deliveredKg: recovery.saleableKg,
      grossProceedsInr: recovery.grossProceedsInr,
      logisticsCostInr: recovery.totalCostsInr,
      netProceedsInr: recovery.netProceedsInr,
      costBreakdownInr: recovery.costBreakdownInr,
    });
    expect(model.noActionBranch.netProceedsInr).toBe(noAction.netProceedsInr);
    expect(model.counterfactualDeltaInr).toBe(
      Number((recovery.netProceedsInr - noAction.netProceedsInr).toFixed(2))
    );
    expect(model.recoveryBranch.logisticsCostInr).not.toBe(
      model.noActionBranch.logisticsCostInr
    );
    const rows = getShipmentReportRows({
      reportId: "rep_scope",
      shipmentId: "ship_scope",
      status: "DELIVERED",
      isSimulatedData: true,
      financialModel: model,
    });
    const text = rows.map((row) => `${row.item}: ${row.value}`).join("\n");
    expect(text).toContain(
      "It does not reconstruct the stored shipment or a Pune delivery."
    );
    expect(text).toContain(
      "Recovery branch cost-line reconciliation: The itemized cost lines add up to the logistics total."
    );
    expect(text).toContain(
      "Recovery branch reference-net reconciliation: The reference net differs from displayed gross minus displayed logistics by ₹-0.01."
    );
    expect(text).toContain("₹38/km");
    expect(text).toContain("₹72/km");
  });

  it("matches the report page schema and keeps the shipment status", async () => {
    const report = await shipmentReportEnvelope({
      shipmentId: "ship_demo",
      status: "DELIVERED",
    });
    expect(shipmentReportSchema.parse(report)).toMatchObject({
      reportId: "rep_ship_demo",
      shipmentId: "ship_demo",
      status: "DELIVERED",
      isSimulatedData: true,
    });
    const rerouted = await shipmentReportEnvelope({
      shipmentId: "ship_rerouted",
      status: "REROUTED",
    });
    expect(rerouted.status).toBe("REROUTED");
    expect(rerouted.status).not.toBe("DELIVERED");
    expect(rerouted.financialModel.counterfactualDeltaInr).toBe(
      report.financialModel.counterfactualDeltaInr
    );
  });
});
