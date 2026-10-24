import { describe, expect, it } from "vitest";

import { COUNTERFACTUAL_DOMAIN_STATUS } from "@/lib/domain/counterfactual";
import {
  byId,
  evaluateScenario,
  loadBaseline,
} from "@/scripts/reference-model.mjs";

describe("canonical recovery comparison", () => {
  it("has a positive recovery delta, a negative intervention delta, and a zero identical-branch delta", async () => {
    const data = await loadBaseline();
    const recovery = evaluateScenario(
      data,
      byId(data.scenarios, "alternative-recovery")
    );
    const noAction = evaluateScenario(data, byId(data.scenarios, "no-action"));
    const negative = evaluateScenario(
      data,
      byId(data.scenarios, "negative-recovery")
    );
    const again = evaluateScenario(data, byId(data.scenarios, "no-action"));

    const positiveDelta = Number(
      (recovery.netProceedsInr - noAction.netProceedsInr).toFixed(2)
    );
    const negativeDelta = Number(
      (negative.netProceedsInr - noAction.netProceedsInr).toFixed(2)
    );
    const zeroDelta = Number(
      (again.netProceedsInr - noAction.netProceedsInr).toFixed(2)
    );

    expect(positiveDelta).toBeGreaterThan(0);
    expect(positiveDelta).toBe(144330.67);
    expect(negativeDelta).toBeLessThan(0);
    expect(negativeDelta).toBe(-204069.2);
    expect(zeroDelta).toBe(0);
    expect(recovery.netProceedsInr).toBe(229586.71);
    expect(noAction.netProceedsInr).toBe(85256.04);
    expect(negative.netProceedsInr).toBe(-118813.16);
    expect(COUNTERFACTUAL_DOMAIN_STATUS).toBe("SCAFFOLD_ONLY");
  });
});
