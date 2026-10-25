import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ScenarioControls,
  runScenarioAction,
  type ScenarioActionState,
} from "@/components/reports/ScenarioControls";
import { scenarioActionDetail } from "@/components/reports/scenario-actions";
import {
  ShipmentReport as ShipmentReportView,
  ShipmentReportSections,
  downloadShipmentReportCsv,
} from "@/components/reports/ShipmentReport";
import {
  shipmentReportToCsv,
  type ShipmentReport,
} from "@/lib/contracts/report.contract";

const emptyCosts = {
  dispatch: 0,
  transport: 0,
  loading: 0,
  intervention: 0,
  storage: 0,
  detention: 0,
  unloading: 0,
  marketFees: 0,
};

const report: ShipmentReport = {
  reportId: "rep_test_1",
  shipmentId: "ship_test_1",
  status: "COMPLETED",
  isSimulatedData: true,
  financialModel: {
    modelScope: "canonical-baseline",
    recoveryScenarioId: "alternative-recovery",
    noActionScenarioId: "no-action",
    sharedPrefixSteps: 2,
    sharedPreIncidentCostInr: 1000,
    roundingPolicy: "Rounded to 2 decimal INR.",
    assumptions: ["Same baseline for both branches."],
    limitations: ["Not proven farmer income."],
    recoveryBranch: {
      scenarioId: "alternative-recovery",
      marketId: "pune",
      deliveredKg: 9400,
      qualityFraction: 0.94,
      grade: "A",
      grossProceedsInr: 263200,
      logisticsCostInr: 28500,
      interventionCostInr: 1500,
      netProceedsInr: 234700,
      costBreakdownInr: { ...emptyCosts, transport: 28500 },
    },
    noActionBranch: {
      scenarioId: "no-action",
      marketId: "vashi",
      deliveredKg: 4100,
      qualityFraction: 0.41,
      grade: "C",
      grossProceedsInr: 82000,
      logisticsCostInr: 18500,
      interventionCostInr: 0,
      netProceedsInr: 63500,
      costBreakdownInr: { ...emptyCosts, transport: 18500 },
    },
    counterfactualDeltaInr: 171200,
  },
};

describe("shipment report presentation", () => {
  it("renders contract values, all requested report sections, and provenance notices", () => {
    const html = renderToStaticMarkup(
      createElement(ShipmentReportSections, { report })
    );
    expect(html).toContain("Harvest details");
    expect(html).toContain("Selected plan");
    expect(html).toContain("Shipment events");
    expect(html).toContain("Incidents");
    expect(html).toContain("Recovery decisions");
    expect(html).toContain("Delivery receipt");
    expect(html).toContain("Final outcome");
    expect(html).toContain("Persisted shipment status");
    expect(html).toContain("COMPLETED");
    expect(html).toContain("do not replace the persisted shipment status");
    expect(html).toContain("not the farmer-desk report");
    expect(html).toContain("Synthetic data");
    expect(html).toContain("Modeled estimate");
    expect(html).toContain("₹");
    expect(html).toContain("Not provided by the current API contract");
  });

  it("exports the same formatted rows shown in the report and adds disclosure rows", () => {
    const csv = shipmentReportToCsv(report);
    const captured: { content?: string; filename?: string } = {};
    downloadShipmentReportCsv(report, (content, filename) => {
      captured.content = content;
      captured.filename = filename;
    });
    expect(captured.content).toBe(csv);
    expect(captured.filename).toBe("shipment-report-rep_test_1.csv");
    expect(csv).toContain(
      '"Modeled financial comparison","Recovery branch net proceeds","₹2,34,700.00"'
    );
    expect(csv).toContain("Synthetic data status is shown in the report");
    expect(csv).toContain('"Persisted shipment status","COMPLETED"');
    expect(csv).toContain("Counterfactual delta");
  });

  it("escapes commas, quotes, and line breaks in CSV cells", () => {
    const tricky: ShipmentReport = {
      ...report,
      financialModel: {
        ...report.financialModel,
        limitations: ['Say "pause",\nthen continue'],
      },
    };
    const csv = shipmentReportToCsv(tricky);
    expect(csv).toContain('"Say ""pause"",\nthen continue"');
    expect(csv.split("\r\n").some((line) => line.includes("pause"))).toBe(true);
  });

  it("explains the Igatpuri story instead of requesting a missing shipment", () => {
    const html = renderToStaticMarkup(
      createElement(ShipmentReportView, { reportId: "demo-igatpuri" })
    );
    expect(html).toContain("Igatpuri story, not a stored shipment");
    expect(html).toContain("Open the Igatpuri story");
    expect(html).not.toContain("Loading report");
    expect(html).not.toContain("HTTP 404");
  });

  it("enables scenario reset and replay when both operations are wired", () => {
    const html = renderToStaticMarkup(
      createElement(ScenarioControls, {
        onReset: async () => "reset completed",
        onReplay: async () => "replay completed",
      })
    );
    expect(html).not.toContain(
      "No scenario API or supported scenario identifiers are currently defined"
    );
  });

  it("marks scenario reset and replay unavailable when no operation is wired", () => {
    const html = renderToStaticMarkup(createElement(ScenarioControls));
    expect(html).toContain(
      "No scenario API or supported scenario identifiers are currently defined"
    );
    expect(html.match(/disabled=/g)).toHaveLength(2);
  });
});

describe("scenario action states", () => {
  it("reports reset and replay failures without claiming success", async () => {
    for (const action of ["reset", "replay"] as const) {
      let state: ScenarioActionState = { status: "idle" };
      await runScenarioAction(
        action,
        async () => {
          throw new Error("HTTP 501 Not Implemented");
        },
        (next) => {
          state = next;
        }
      );
      expect(state).toEqual({
        status: "error",
        action,
        message: "HTTP 501 Not Implemented",
      });
    }
  });

  it("shows the replayed modeled net and keeps it separate from a shipment", async () => {
    let state: ScenarioActionState = { status: "idle" };
    const detail = scenarioActionDetail({
      action: "replay",
      restored: true,
      status: "SIMULATED",
      scenarioId: "alternative-recovery",
      modeledOutcome: {
        saleableKg: 9886.875,
        grossProceedsInr: 266945.63,
        logisticsCostInr: 37358.91,
        netProceedsInr: 229586.71,
      },
    });
    await runScenarioAction(
      "replay",
      async () => detail,
      (next) => {
        state = next;
      }
    );
    expect(detail).toContain("₹2,29,586.71");
    expect(detail).toContain("not a persisted shipment outcome");
    expect(state).toEqual({
      status: "success",
      action: "replay",
      message: detail,
    });
  });
});
