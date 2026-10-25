import { describe, expect, it } from "vitest";

import baseline from "@/data/demo-baseline.json";
import {
  assertVehicleCapacity,
  qualityAt,
  routeTotals,
  unloadingWaitHours,
} from "@/scripts/reference-model.mjs";
import { buildFarmerDesk } from "@/lib/domain/farmer-desk";

describe("financial calculation boundaries", () => {
  it("keeps quality boundaries inclusive and rejects invalid ages", () => {
    expect(qualityAt(baseline, 24)).toMatchObject({
      grade: "A",
      qualityFraction: 0.92,
      saleableFraction: 0.99,
    });
    expect(qualityAt(baseline, 48).grade).toBe("B");
    expect(qualityAt(baseline, 240)).toMatchObject({
      grade: "REJECT",
      saleableFraction: 0,
      referenceShelfLifeRemainingHours: 0,
    });
    for (const age of [-0.01, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => qualityAt(baseline, age)).toThrow("Invalid effective age");
    }
  });

  it("rejects empty or disconnected routes and loads outside fleet limits", () => {
    expect(() => routeTotals(baseline, [])).toThrow(
      "Route must contain an edge"
    );
    expect(() => routeTotals(baseline, ["igatpuri-vashi"])).toThrow(
      "Disconnected route"
    );
    const truck = baseline.vehicles.find(
      (vehicle) => vehicle.id === "standard-10t"
    );
    if (!truck) throw new Error("Missing standard truck fixture");
    for (const count of [0, 1.5, truck.availableCount + 1]) {
      expect(() => assertVehicleCapacity(baseline, truck, count)).toThrow(
        "Invalid fleet count"
      );
    }
  });

  it("honors unloading close boundaries and rejects invalid arrival times", () => {
    const vashi = baseline.markets.find((market) => market.id === "vashi");
    if (!vashi) throw new Error("Missing Vashi fixture");
    const [open, close] = vashi.unloadingSlotsLocalHours[0];
    expect(unloadingWaitHours(vashi, open)).toBe(0);
    expect(unloadingWaitHours(vashi, close - vashi.unloadingHours)).toBe(0);
    expect(unloadingWaitHours(vashi, close)).toBeGreaterThan(0);
    for (const arrival of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => unloadingWaitHours(vashi, arrival)).toThrow(
        "Invalid arrival time"
      );
    }
  });

  it("rounds modeled currency to paise and ranks mandis by net proceeds", () => {
    const desk = buildFarmerDesk();
    const mandis = desk.offers.filter(
      (offer) => offer.kind !== "premium-buyer"
    );
    const bestNet = Math.max(...mandis.map((offer) => offer.netProceedsInr));

    expect(desk.recommendedMandiId).toBe(
      mandis.find((offer) => offer.netProceedsInr === bestNet)?.id
    );
    expect(mandis.some((offer) => offer.id === desk.recommendedMandiId)).toBe(
      true
    );
    for (const offer of desk.offers) {
      for (const amount of [
        offer.grossProceedsInr,
        offer.freightInr,
        offer.otherCostsInr,
        offer.totalCostInr,
        offer.netProceedsInr,
      ]) {
        expect(Number.isFinite(amount)).toBe(true);
        expect(Number(amount.toFixed(2))).toBe(amount);
      }
    }
  });
});
