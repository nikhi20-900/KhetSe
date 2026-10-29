import { describe, expect, it } from "vitest";
import {
  comparisonFor,
  costRowsOf,
  directMarketPlans,
  recoveryById,
  recoveryViews,
  singleReeferBlock,
} from "@/lib/domain/baseline-journey";

describe("canonical journey presentation", () => {
  it("evaluates the three direct markets from the baseline calculator", () => {
    const { plans, blocked } = directMarketPlans(10_000);
    expect(blocked).toBeNull();
    const byMarket = Object.fromEntries(plans.map((plan) => [plan.marketId, plan]));
    expect(byMarket.vashi).toMatchObject({
      distanceKm: 250,
      transitHours: 6.5,
      logisticsCostInr: 20580.17,
      netProceedsInr: 258428.17,
      badges: ["Lowest logistics cost"],
    });
    expect(byMarket.surat).toMatchObject({
      distanceKm: 270,
      transitHours: 6,
      logisticsCostInr: 21620,
      netProceedsInr: 277380,
      badges: ["Fastest transit · highest net"],
    });
    expect(byMarket.pune).toMatchObject({
      distanceKm: 260,
      transitHours: 6.5,
      logisticsCostInr: 20897.5,
      netProceedsInr: 247977.5,
      badges: ["Alternative destination"],
    });
  });

  it("blocks a single reefer van and an overloaded standard truck", () => {
    const reefer = singleReeferBlock(10_000);
    expect(reefer?.capacityKg).toBe(2500);
    expect(reefer?.fleetCouldFit).toBe(true);
    expect(reefer?.message).toContain("2,500 kg");
    expect(reefer?.message).toContain("10,000 kg");
    const overloaded = directMarketPlans(12_000);
    expect(overloaded.plans).toHaveLength(0);
    expect(overloaded.blocked?.message).toContain("12,000 kg");
  });

  it("reconciles recovery outcomes with the no-action baseline", () => {
    const views = recoveryViews();
    const noAction = recoveryById("no-action");
    expect(noAction.netProceedsInr).toBe(85256.04);
    expect(noAction.grade).toBe("C");
    expect(noAction.completionHours).toBe(56.5);

    for (const view of views) {
      expect(view.saleableKg).toBeLessThanOrEqual(10_000);
      expect(
        Math.abs(
          view.netProceedsInr - (view.grossProceedsInr - view.totalCostsInr)
        )
      ).toBeLessThanOrEqual(0.02);
      const rowSum = view.costRows.reduce((sum, row) => sum + row.amountInr, 0);
      expect(rowSum).toBeCloseTo(view.totalCostsInr, 2);
      if (view.deltaInr != null) {
        expect(view.deltaInr).toBeCloseTo(
          view.netProceedsInr - noAction.netProceedsInr,
          2
        );
      }
    }

    const transfer = recoveryById("alternative-recovery");
    expect(transfer.recommended).toBe(true);
    expect(transfer.netProceedsInr).toBe(229586.71);
    expect(transfer.deltaInr).toBeCloseTo(144330.67, 2);
    expect(transfer.interventionCostInr).toBe(18940);
    expect(transfer.grade).toBe("A");
    expect(transfer.completionHours).toBe(34);
    expect(transfer.onwardHours).toBe(5.5);
    expect(transfer.timeline.map((entry) => entry.title)).toEqual([
      "Breakdown recorded at Nashik",
      "Transfer to ventilated truck · 2 h",
      "Cold room intake complete · 2 h",
      "Cold storage hold · 6 h",
      "Conditioned release complete · 2 h",
    ]);
    expect(transfer.timeline.map((entry) => entry.atHours)).toEqual([
      1, 3, 5.5, 11.5, 13.5,
    ]);

    const repair = recoveryById("vehicle-breakdown");
    expect(repair.recommended).toBe(false);
    expect(repair.netProceedsInr).toBe(187074.4);
    expect(repair.grade).toBe("B");

    const negative = comparisonFor("negative");
    expect(negative.deltaInr).toBeLessThan(0);
    expect(negative.recovery.recommended).toBe(false);
    expect(negative.illustrative).toBe(false);

    const equal = comparisonFor("equal");
    expect(equal.illustrative).toBe(true);
    expect(equal.deltaInr).toBe(0);
    expect(equal.recovery.netProceedsInr).toBe(noAction.netProceedsInr);
  });

  it("uses the same cost rows the report exports", () => {
    const transfer = recoveryById("alternative-recovery");
    expect(costRowsOf).toBeTypeOf("function");
    expect(transfer.costRows.map((row) => [row.label, row.amountInr])).toEqual([
      ["Dispatch", 4800],
      ["Transport", 10020],
      ["Loading", 4500],
      ["Storage", 4900],
      ["Detention", 4800],
      ["Unloading", 3000],
      ["Market fee", 5338.91],
    ]);
  });
});
