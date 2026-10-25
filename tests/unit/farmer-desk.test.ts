import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FarmerDesk, BreakdownPreview } from "@/components/farmer/FarmerDesk";
import { getShipmentReportRows } from "@/lib/contracts/report.contract";
import { buildFarmerDesk } from "@/lib/domain/farmer-desk";
import { canInjectBreakdown } from "@/lib/domain/breakdown-control";
import { parseFarmerReplay } from "@/lib/domain/farmer-replay";
import {
  canonicalComparison,
  financialModelFromComparison,
} from "@/lib/domain/shipment-report";
import { formatModeledInr } from "@/lib/planning/format";
import {
  byId,
  evaluateScenario,
  loadBaseline,
} from "@/scripts/reference-model.mjs";

const EXPECTED = {
  "vashi-mandi": {
    netProceedsInr: 258428.17,
    freightInr: 12000,
    otherCostsInr: 8580.17,
    totalCostInr: 20580.17,
    wastageKg: 35.417,
  },
  "pune-mandi": {
    netProceedsInr: 247977.5,
    freightInr: 12320,
    otherCostsInr: 8577.5,
    totalCostInr: 20897.5,
    wastageKg: 41.667,
  },
  "surat-mandi": {
    netProceedsInr: 277380,
    freightInr: 12640,
    otherCostsInr: 8980,
    totalCostInr: 21620,
    wastageKg: 33.333,
  },
  "pune-premium": {
    netProceedsInr: 229586.71,
    freightInr: 19320,
    otherCostsInr: 18038.91,
    totalCostInr: 37358.91,
    wastageKg: 113.125,
  },
} as const;

describe("farmer desk", () => {
  it("prices every offer and the breakdown deltas from the baseline calculator", async () => {
    const data = await loadBaseline();
    const normal = evaluateScenario(
      data,
      byId(data.scenarios, "normal-delivery")
    );
    const premium = evaluateScenario(
      data,
      byId(data.scenarios, "alternative-recovery")
    );
    const desk = buildFarmerDesk();

    expect(desk.persisted).toBe(false);
    expect(desk.quantityKg).toBe(10000);
    for (const offer of desk.offers) {
      const expected = EXPECTED[offer.id as keyof typeof EXPECTED];
      expect(offer.netProceedsInr).toBe(expected.netProceedsInr);
      expect(offer.freightInr).toBe(expected.freightInr);
      expect(offer.otherCostsInr).toBe(expected.otherCostsInr);
      expect(offer.totalCostInr).toBe(expected.totalCostInr);
      expect(offer.wastageKg).toBe(expected.wastageKg);
      expect(Number((offer.freightInr + offer.otherCostsInr).toFixed(2))).toBe(
        offer.totalCostInr
      );
      expect(Number((desk.quantityKg - offer.saleableKg).toFixed(3))).toBe(
        offer.wastageKg
      );
    }

    const vashi = desk.offers.find((offer) => offer.id === "vashi-mandi");
    const buyer = desk.offers.find((offer) => offer.id === "pune-premium");
    expect(vashi?.netProceedsInr).toBe(normal.netProceedsInr);
    expect(buyer?.netProceedsInr).toBe(premium.netProceedsInr);
    expect(desk.recommendedMandiId).toBe("surat-mandi");

    const repair = desk.disturbance.alternatives.find(
      (item) => item.id === "repair"
    );
    const reroute = desk.disturbance.alternatives.find(
      (item) => item.id === "reroute"
    );
    const noAction = desk.disturbance.alternatives.find(
      (item) => item.id === "no-action"
    );
    expect(repair).toMatchObject({
      netProceedsInr: 187074.4,
      deltaInr: 101818.36,
    });
    expect(reroute).toMatchObject({
      netProceedsInr: 229586.71,
      deltaInr: 144330.67,
    });
    expect(noAction).toMatchObject({
      netProceedsInr: 85256.04,
      deltaInr: 0,
    });
    expect(desk.disturbance.recommendedId).toBe("reroute");
    expect(desk.disturbance.recommendationNote).toContain("not a promise");
    expect(desk.weather.label).toContain("not a live forecast");
  });

  it("does not import shipment persistence", () => {
    const source = [
      readFileSync("lib/domain/farmer-desk.ts", "utf8"),
      readFileSync("components/farmer/FarmerDesk.tsx", "utf8"),
      readFileSync("lib/domain/farmer-replay.ts", "utf8"),
    ].join("\n");
    expect(source).not.toMatch(
      /prisma|getPrisma|\/api\/shipments|\/api\/reservations/
    );
  });

  it("renders the preview boundary and a reproducible breakdown", () => {
    const desk = buildFarmerDesk();
    const start = renderToStaticMarkup(
      createElement(FarmerDesk, { desk, rejectedReplay: true })
    );
    expect(start).toContain("Nashik Red Onion");
    expect(start).toContain("Tomato");
    expect(start).toContain("Preview, not a stored shipment");
    expect(start).toContain('data-persisted="false"');
    expect(start).toContain("That replay id is not registered");

    const breakdown = renderToStaticMarkup(
      createElement(FarmerDesk, { desk, replay: "breakdown" })
    );
    expect(breakdown).toContain("Cold room, then Pune");
    expect(breakdown).toContain("Repair, then Vashi");
    expect(breakdown).toContain("No action, then Vashi");
    expect(breakdown).toContain('data-selected-response="reroute"');
    expect(breakdown).toContain("Highest of these three");
    expect(breakdown).toContain("does not recalculate");
    expect(breakdown).toContain("₹1,44,330.67");
    expect(breakdown).toContain("₹1,01,818.36");
    expect(breakdown).toContain("₹1,87,074.40");
    expect(breakdown).toContain("₹0.00");
    expect(breakdown).toContain("not a promise");
    expect(breakdown).toContain("not a live GPS track");
    expect(breakdown).toContain("Nashik demo cold room (fictional)");
    expect(breakdown).toContain("Pune APMC, Gultekdi");
    expect(breakdown).toContain("The registered rupee figures do not change");
    expect(breakdown).not.toContain("Igatpuri checkpoint (fictional)");

    const mandi = renderToStaticMarkup(
      createElement(FarmerDesk, { desk, replay: "vashi-mandi" })
    );
    expect(mandi).toContain("₹2,58,428.17");
    expect(mandi).toContain("₹12,000.00");
    expect(mandi).toContain("does not reserve a truck");
    expect(mandi).toContain("Registered places");
    expect(mandi).toContain("registered price");
    expect(parseFarmerReplay("vashi-mandi")).toBe("vashi-mandi");
    expect(parseFarmerReplay("live-gps")).toBeNull();
  });

  it("agrees with the stored report's registered comparison", () => {
    const desk = buildFarmerDesk();
    const model = financialModelFromComparison(canonicalComparison());
    const premium = desk.offers.find((offer) => offer.id === "pune-premium");
    const reroute = desk.disturbance.alternatives.find(
      (item) => item.id === "reroute"
    );
    const noAction = desk.disturbance.alternatives.find(
      (item) => item.id === "no-action"
    );
    expect(premium?.netProceedsInr).toBe(model.recoveryBranch.netProceedsInr);
    expect(premium?.totalCostInr).toBe(model.recoveryBranch.logisticsCostInr);
    expect(reroute?.netProceedsInr).toBe(model.recoveryBranch.netProceedsInr);
    expect(reroute?.deltaInr).toBe(model.counterfactualDeltaInr);
    expect(noAction?.netProceedsInr).toBe(model.noActionBranch.netProceedsInr);
    expect(noAction?.deltaInr).toBe(0);

    const rows = getShipmentReportRows({
      reportId: "rep_scope",
      shipmentId: "ship_scope",
      status: "DISPATCHED",
      isSimulatedData: true,
      financialModel: model,
    });
    const text = rows.map((row) => `${row.item}: ${row.value}`).join("\n");
    expect(text).toContain(
      `Recovery branch net proceeds: ${formatModeledInr(229586.71)}`
    );
    expect(text).toContain(
      `No-action branch net proceeds: ${formatModeledInr(85256.04)}`
    );
    expect(text).toContain(
      `Counterfactual delta: ${formatModeledInr(144330.67)}`
    );
    expect(text).toContain("Persisted shipment status: DISPATCHED");
  });

  it("keeps each breakdown report on its own registered result and timeline", () => {
    const desk = buildFarmerDesk();
    const vashi = desk.offers.find((offer) => offer.id === "vashi-mandi");
    expect(desk.disturbance.undisturbedVashiNetInr).toBe(258428.17);
    expect(desk.disturbance.undisturbedVashiNetInr).toBe(vashi?.netProceedsInr);
    expect(desk.disturbance.recommendedId).toBe("reroute");
    expect(desk.coldPricedArrivalHours).toBe(19);
    expect(desk.coldPricedCompletionHours).toBe(34);
    expect(desk.coldRoute[1]?.hours).toBe(1);
    expect(desk.breakdownMarkerIndex).toBe(1);
    expect(canInjectBreakdown(0, desk.breakdownMarkerIndex, false)).toBe(false);
    expect(canInjectBreakdown(1, desk.breakdownMarkerIndex, false)).toBe(true);
    expect(canInjectBreakdown(1, desk.breakdownMarkerIndex, true)).toBe(false);

    const labels = (id: "repair" | "reroute" | "no-action") =>
      desk.disturbance.alternatives
        .find((item) => item.id === id)!
        .checkpoints.map((point) => point.label);
    expect(labels("reroute")).toContain("Nashik demo cold room (fictional)");
    expect(labels("reroute").at(-1)).toContain("Pune APMC");
    expect(labels("repair")).toContain("Registered 24-hour stalled hot pause");
    expect(labels("repair")).toContain("Igatpuri checkpoint (fictional)");
    expect(labels("repair").at(-1)).toBe("Vashi APMC Mumbai");
    expect(labels("repair")).not.toContain("Nashik demo cold room (fictional)");
    expect(labels("no-action")).toContain(
      "Registered 48-hour stalled hot pause"
    );
    expect(labels("no-action").at(-1)).toBe("Vashi APMC Mumbai");
    expect(labels("no-action")).not.toContain(
      "Nashik demo cold room (fictional)"
    );

    const expected = {
      repair: {
        netProceedsInr: 187074.4,
        deltaInr: 101818.36,
        saleableKg: 9387.5,
        grade: "B",
        freightInr: 12000,
        arrivalHours: 30.5,
        completionHours: 32.5,
        effectiveAgeHours: 56.5,
      },
      reroute: {
        netProceedsInr: 229586.71,
        deltaInr: 144330.67,
        saleableKg: 9886.875,
        grade: "A",
        freightInr: 19320,
        arrivalHours: 19,
        completionHours: 34,
        effectiveAgeHours: 25.05,
      },
      "no-action": {
        netProceedsInr: 85256.04,
        deltaInr: 0,
        saleableKg: 7307.292,
        grade: "C",
        freightInr: 12000,
        arrivalHours: 54.5,
        completionHours: 56.5,
        effectiveAgeHours: 104.5,
      },
    } as const;

    for (const id of ["repair", "reroute", "no-action"] as const) {
      const response = desk.disturbance.alternatives.find(
        (item) => item.id === id
      );
      expect(response).toMatchObject(expected[id]);
      expect(response!.netProceedsInr).toBeLessThan(
        desk.disturbance.undisturbedVashiNetInr
      );
      const html = renderToStaticMarkup(
        createElement(BreakdownPreview, {
          response: response!,
          undisturbedNetInr: desk.disturbance.undisturbedVashiNetInr,
          checkpointLabel: "Nashik transfer checkpoint (fictional)",
          checkpointHours: 1,
          persistenceNote: desk.persistenceNote,
        })
      );
      expect(html).toContain(response!.title);
      expect(html).toContain(formatModeledInr(response!.netProceedsInr));
      expect(html).toContain(formatModeledInr(response!.freightInr));
      expect(html).toContain(`Grade`);
      expect(html).toContain(`>${response!.grade}<`);
      expect(html).toContain("1.00 h");
      expect(html).toContain(`${response!.completionHours.toFixed(2)} h`);
      expect(html).toContain("does not recalculate");
      expect(html).toContain("not a persisted shipment");
      expect(html).toContain("separate scenario");
      expect(html).toContain(formatModeledInr(258428.17));
      expect(html).toContain("modeled estimate");
      if (id !== "reroute") {
        expect(html).not.toContain(formatModeledInr(229586.71));
      }
      if (id !== "repair") {
        expect(html).not.toContain(formatModeledInr(187074.4));
      }
    }
  });
});
