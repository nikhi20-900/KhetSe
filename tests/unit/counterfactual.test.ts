import { describe, expect, it } from "vitest";

import baseline from "@/data/demo-baseline.json";
import {
  COUNTERFACTUAL_DOMAIN_STATUS,
  COUNTERFACTUAL_ROUNDING_POLICY,
  CounterfactualError,
  compareBranches,
  type DemoBaseline,
} from "@/lib/domain/counterfactual";
import { itemizeModeledBranch } from "@/lib/domain/financials";

function compare(
  recoveryScenarioId: string,
  noActionScenarioId: string,
  source: DemoBaseline = baseline
) {
  return compareBranches({
    baseline: source,
    recoveryScenarioId,
    noActionScenarioId,
  });
}

describe("counterfactual comparison", () => {
  it("reproduces the positive, negative, and identical-branch fixture deltas", () => {
    const positive = compare("alternative-recovery", "no-action");
    const negative = compare("negative-recovery", "no-action");
    const zero = compare("no-action", "no-action");

    expect(COUNTERFACTUAL_DOMAIN_STATUS).toBe("IMPLEMENTED");
    expect(positive.counterfactualDeltaInr).toBe(144330.67);
    expect(positive.recoveryBranch.netProceedsInr).toBe(229586.71);
    expect(positive.noActionBranch.netProceedsInr).toBe(85256.04);
    expect(negative.counterfactualDeltaInr).toBe(-204069.2);
    expect(negative.recoveryBranch.netProceedsInr).toBe(-118813.16);
    expect(zero.counterfactualDeltaInr).toBe(0);
    expect(zero.recoveryBranch.netProceedsInr).toBe(
      zero.noActionBranch.netProceedsInr
    );
  });

  it("is deterministic and rounds the delta to paise", () => {
    const first = compare("alternative-recovery", "no-action");
    const second = compare("alternative-recovery", "no-action");
    expect(second).toEqual(first);
    expect(first.counterfactualDeltaInr).toBe(
      Number(
        (
          first.recoveryBranch.netProceedsInr -
          first.noActionBranch.netProceedsInr
        ).toFixed(2)
      )
    );
    expect(first.roundingPolicy).toBe(COUNTERFACTUAL_ROUNDING_POLICY);
  });

  it("changes when recovery cost, price, degradation, or quantity changes", () => {
    const original = compare("alternative-recovery", "no-action");

    const costlier = structuredClone(baseline);
    const recovery = costlier.scenarios.find(
      (scenario) => scenario.id === "alternative-recovery"
    );
    const replacement = recovery?.steps.find(
      (step) => step.type === "dispatch" && step.vehicleId === "ventilated-10t"
    );
    if (
      replacement?.type !== "dispatch" ||
      replacement.surchargeInr === undefined
    ) {
      throw new Error("Missing recovery dispatch");
    }
    replacement.surchargeInr += 5000;
    const costlierResult = compare(
      "alternative-recovery",
      "no-action",
      costlier
    );
    expect(costlierResult.recoveryBranch.logisticsCostInr).toBeGreaterThan(
      original.recoveryBranch.logisticsCostInr
    );
    expect(costlierResult.counterfactualDeltaInr).toBeLessThan(
      original.counterfactualDeltaInr
    );

    const priced = structuredClone(baseline);
    const pune = priced.markets.find((market) => market.id === "pune");
    if (!pune) throw new Error("Missing Pune market");
    pune.priceInrPerKg += 1;
    const pricedResult = compare("alternative-recovery", "no-action", priced);
    expect(pricedResult.recoveryBranch.grossProceedsInr).not.toBe(
      original.recoveryBranch.grossProceedsInr
    );
    expect(pricedResult.noActionBranch.grossProceedsInr).toBe(
      original.noActionBranch.grossProceedsInr
    );

    const degraded = structuredClone(baseline);
    const stalled = degraded.environments.find(
      (environment) => environment.id === "stalled-hot"
    );
    if (!stalled) throw new Error("Missing stalled environment");
    stalled.ageMultiplier += 0.5;
    const degradedResult = compare(
      "alternative-recovery",
      "no-action",
      degraded
    );
    expect(degradedResult.noActionBranch.deliveredKg).not.toBe(
      original.noActionBranch.deliveredKg
    );

    const smaller = structuredClone(baseline);
    smaller.crop.quantityKg = 8_000;
    const smallerResult = compare("alternative-recovery", "no-action", smaller);
    expect(smallerResult.recoveryBranch.deliveredKg).not.toBe(
      original.recoveryBranch.deliveredKg
    );
    expect(smallerResult.noActionBranch.deliveredKg).not.toBe(
      original.noActionBranch.deliveredKg
    );
  });

  it("prices identical opening steps once as the shared pre-incident cost", () => {
    const comparison = compare("alternative-recovery", "no-action");
    expect(comparison.sharedPrefixSteps).toBe(2);
    expect(comparison.sharedPreIncidentCostInr).toBeGreaterThan(0);
    expect(comparison.sharedPreIncidentCostInr).toBeLessThan(
      comparison.recoveryBranch.logisticsCostInr
    );
    expect(comparison.sharedPreIncidentCostInr).toBeLessThan(
      comparison.noActionBranch.logisticsCostInr
    );
    const lines = itemizeModeledBranch(comparison.recoveryBranch);
    expect(lines.map((line) => line.component)).toContain("Transport");
    expect(lines.every((line) => line.meaning === "modeled estimate")).toBe(
      true
    );
  });

  it("rejects a missing scenario, a blank id, and an inconsistent route", () => {
    expect(() => compare("missing-scenario", "no-action")).toThrow(
      CounterfactualError
    );
    expect(() =>
      compareBranches({
        baseline,
        recoveryScenarioId: " ",
        noActionScenarioId: "no-action",
      })
    ).toThrow(/Recovery scenario is required/);
    const broken = structuredClone(baseline);
    const scenario = broken.scenarios.find(
      (entry) => entry.id === "alternative-recovery"
    );
    const travel = scenario?.steps.find(
      (step) => step.type === "travel" && step.edgeId === "cold-pune"
    );
    if (travel?.type !== "travel") throw new Error("Missing recovery edge");
    travel.edgeId = "igatpuri-vashi";
    expect(() => compare("alternative-recovery", "no-action", broken)).toThrow(
      CounterfactualError
    );
  });
});
