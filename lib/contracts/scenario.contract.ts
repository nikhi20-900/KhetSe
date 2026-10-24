import { z } from "zod";

import baseline from "@/data/demo-baseline.json";

/** Scenario ids owned by the canonical baseline register. */
export const BASELINE_SCENARIO_IDS = baseline.scenarios.map(
  (scenario) => scenario.id
);

export const SCENARIO_ACTIONS = ["reset", "replay"] as const;

export const scenarioCommandSchema = z
  .object({
    action: z.enum(SCENARIO_ACTIONS),
    scenarioId: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.action === "replay" && !value.scenarioId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scenarioId"],
        message: "Replay requires a scenario id from data/demo-baseline.json.",
      });
    }
    if (value.scenarioId && !BASELINE_SCENARIO_IDS.includes(value.scenarioId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scenarioId"],
        message: "That scenario is not in the baseline register.",
      });
    }
  });

export type ScenarioCommand = z.infer<typeof scenarioCommandSchema>;

export interface ModeledScenarioOutcome {
  saleableKg: number;
  grossProceedsInr: number;
  logisticsCostInr: number;
  netProceedsInr: number;
}

export interface ScenarioCommandResult {
  action: "reset" | "replay";
  restored: true;
  status: "SIMULATED";
  scenarioId: string | null;
  modeledOutcome: ModeledScenarioOutcome | null;
}
