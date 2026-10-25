import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FarmerDesk } from "@/components/farmer/FarmerDesk";
import FarmerPage from "@/app/farmer/page";
import { getShipmentReportRows } from "@/lib/contracts/report.contract";
import { buildFarmerDesk } from "@/lib/domain/farmer-desk";
import { FARMER_REPLAYS, parseFarmerReplay } from "@/lib/domain/farmer-replay";
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
    expect(breakdown).toContain("₹1,44,330.67");
    expect(breakdown).toContain("₹1,01,818.36");
    expect(breakdown).toContain("₹1,87,074.40");
    expect(breakdown).toContain("₹0.00");
    expect(breakdown).toContain("not a promise");
    expect(breakdown).not.toContain("persisted shipment outcome");

    const mandi = renderToStaticMarkup(
      createElement(FarmerDesk, { desk, replay: "vashi-mandi" })
    );
    expect(mandi).toContain("₹2,58,428.17");
    expect(mandi).toContain("₹12,000.00");
    expect(mandi).toContain("does not reserve a truck");
    expect(parseFarmerReplay("vashi-mandi")).toBe("vashi-mandi");
    expect(parseFarmerReplay("live-gps")).toBeNull();
  });

  it("reopens replay URLs deterministically after reset navigation", async () => {
    for (const replay of FARMER_REPLAYS) {
      const url = new URL(replay.href, "https://khetse.test");
      expect(url.pathname).toBe("/farmer");
      expect(url.searchParams.get("replay")).toBe(replay.id);
      expect(
        parseFarmerReplay(url.searchParams.get("replay") ?? undefined)
      ).toBe(replay.id);
    }

    const openPage = async (replay?: string) =>
      renderToStaticMarkup(
        await FarmerPage({
          searchParams: Promise.resolve(replay ? { replay } : {}),
        })
      );

    const premiumQuote = await openPage("pune-premium");
    const cropChoice = await openPage();
    const premiumAfterBackForward = await openPage("pune-premium");
    expect(premiumQuote).toContain("Replaying Pune premium quote");
    expect(premiumQuote).not.toContain("Quality photo");
    expect(cropChoice).toContain("Continue with Nashik Red Onion");
    expect(premiumAfterBackForward).toBe(premiumQuote);
    expect(await openPage("unknown")).toContain(
      "That replay id is not registered"
    );
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
});
