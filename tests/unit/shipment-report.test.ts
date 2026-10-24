import { describe, expect, it } from "vitest";

import { shipmentReportSchema } from "@/lib/contracts/report.contract";
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
    expect(model.recoveryBranch).toEqual({
      deliveredKg: recovery.saleableKg,
      grossProceedsInr: recovery.grossProceedsInr,
      logisticsCostInr: recovery.totalCostsInr,
      netProceedsInr: recovery.netProceedsInr,
    });
    expect(model.noActionBranch.netProceedsInr).toBe(noAction.netProceedsInr);
    expect(model.counterfactualDeltaInr).toBe(
      Number((recovery.netProceedsInr - noAction.netProceedsInr).toFixed(2))
    );
    expect(model.recoveryBranch.logisticsCostInr).not.toBe(
      model.noActionBranch.logisticsCostInr
    );
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
  });
});
