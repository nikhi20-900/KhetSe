import { describe, expect, it } from "vitest";

import baseline from "@/data/demo-baseline.json";
import { compareBranches } from "@/lib/domain/counterfactual";

describe("canonical recovery comparison", () => {
  it("has a positive recovery delta, a negative intervention delta, and a zero identical-branch delta", () => {
    const recovery = compareBranches({
      baseline,
      recoveryScenarioId: "alternative-recovery",
      noActionScenarioId: "no-action",
    });
    const negative = compareBranches({
      baseline,
      recoveryScenarioId: "negative-recovery",
      noActionScenarioId: "no-action",
    });
    const identical = compareBranches({
      baseline,
      recoveryScenarioId: "no-action",
      noActionScenarioId: "no-action",
    });

    expect(recovery.counterfactualDeltaInr).toBeGreaterThan(0);
    expect(recovery.counterfactualDeltaInr).toBe(144330.67);
    expect(negative.counterfactualDeltaInr).toBeLessThan(0);
    expect(negative.counterfactualDeltaInr).toBe(-204069.2);
    expect(identical.counterfactualDeltaInr).toBe(0);
    expect(recovery.recoveryBranch.netProceedsInr).toBe(229586.71);
    expect(recovery.noActionBranch.netProceedsInr).toBe(85256.04);
    expect(negative.recoveryBranch.netProceedsInr).toBe(-118813.16);
  });
});
