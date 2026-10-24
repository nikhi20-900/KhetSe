import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ScenarioControls,
  runScenarioAction,
  type ScenarioActionState,
} from "@/components/reports/ScenarioControls";
import {
  ShipmentReportSections,
  downloadShipmentReportCsv,
} from "@/components/reports/ShipmentReport";
import {
  shipmentReportToCsv,
  type ShipmentReport,
} from "@/lib/contracts/report.contract";

const report: ShipmentReport = {
  reportId: "rep_test_1",
  shipmentId: "ship_test_1",
  status: "COMPLETED",
  isSimulatedData: true,
  financialModel: {
    recoveryBranch: {
      deliveredKg: 9400,
      grossProceedsInr: 263200,
      logisticsCostInr: 28500,
      netProceedsInr: 234700,
    },
    noActionBranch: {
      deliveredKg: 4100,
      grossProceedsInr: 82000,
      logisticsCostInr: 18500,
      netProceedsInr: 63500,
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
      '"Modeled financial comparison","Recovery branch net proceeds","₹2,34,700"'
    );
    expect(csv).toContain("Synthetic data status is shown in the report");
  });

  it("enables scenario reset and replay when both operations are wired", () => {
    const html = renderToStaticMarkup(
      createElement(ScenarioControls, {
        onReset: async () => undefined,
        onReplay: async () => undefined,
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
});
