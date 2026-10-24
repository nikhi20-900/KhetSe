import { describe, expect, it } from "vitest";

import { scenarioRequestBody } from "@/components/reports/scenario-actions";
import {
  BASELINE_SCENARIO_IDS,
  scenarioCommandSchema,
} from "@/lib/contracts/scenario.contract";

describe("scenario reset and replay contract", () => {
  it("accepts reset and a baseline replay id", () => {
    expect(BASELINE_SCENARIO_IDS).toEqual(
      expect.arrayContaining([
        "normal-delivery",
        "vehicle-breakdown",
        "alternative-recovery",
        "no-action",
        "negative-recovery",
      ])
    );
    expect(scenarioCommandSchema.parse({ action: "reset" }).action).toBe(
      "reset"
    );
    expect(
      scenarioCommandSchema.parse({
        action: "replay",
        scenarioId: "no-action",
      }).scenarioId
    ).toBe("no-action");
    expect(scenarioRequestBody("replay")).toEqual({
      action: "replay",
      scenarioId: "alternative-recovery",
    });
  });

  it("rejects replay without a registered scenario", () => {
    expect(scenarioCommandSchema.safeParse({ action: "replay" }).success).toBe(
      false
    );
    expect(
      scenarioCommandSchema.safeParse({
        action: "replay",
        scenarioId: "not-a-baseline-scenario",
      }).success
    ).toBe(false);
  });
});
