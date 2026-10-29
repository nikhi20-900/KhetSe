import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SimulationLab } from "@/components/simulation/SimulationLab";
import {
  evaluateSimulationLab,
  SIMULATION_LAB_STATUS,
} from "@/lib/domain/simulation-lab";

describe("simulation lab", () => {
  it("reprices the registered cold recovery without persisting anything", () => {
    const result = evaluateSimulationLab({
      disruptionId: "breakdown",
      responseId: "cold-recovery",
    });
    expect(SIMULATION_LAB_STATUS).toBe("IN_MEMORY_ONLY");
    expect(result.persisted).toBe(false);
    expect(result.comparison.counterfactualDeltaInr).toBe(144330.67);
    expect(result.comparison.recoveryBranch.netProceedsInr).toBe(229586.71);
    expect(result.comparison.noActionBranch.netProceedsInr).toBe(85256.04);
    expect(
      result.selectedLines.every((line) => line.meaning === "modeled estimate")
    ).toBe(true);
  });

  it("recalculates deterministically when pause or surcharge changes", () => {
    const repair = evaluateSimulationLab({
      disruptionId: "breakdown",
      responseId: "repair",
    });
    const longer = evaluateSimulationLab({
      disruptionId: "breakdown",
      responseId: "repair",
      repairPauseHours: 48,
    });
    const again = evaluateSimulationLab({
      disruptionId: "breakdown",
      responseId: "repair",
      repairPauseHours: 48,
    });
    expect(again).toEqual(longer);
    expect(longer.comparison.recoveryBranch.netProceedsInr).not.toBe(
      repair.comparison.recoveryBranch.netProceedsInr
    );

    const recovery = evaluateSimulationLab({
      disruptionId: "breakdown",
      responseId: "cold-recovery",
    });
    const costlier = evaluateSimulationLab({
      disruptionId: "breakdown",
      responseId: "cold-recovery",
      recoverySurchargeInr: 5000,
    });
    expect(costlier.comparison.counterfactualDeltaInr).toBeLessThan(
      recovery.comparison.counterfactualDeltaInr
    );
    expect(
      evaluateSimulationLab({
        disruptionId: "breakdown",
        responseId: "negative-recovery",
      }).comparison.counterfactualDeltaInr
    ).toBe(-204069.2);
    expect(
      evaluateSimulationLab({
        disruptionId: "none",
        responseId: "planned",
      }).comparison.counterfactualDeltaInr
    ).toBe(0);
  });

  it("rejects an unregistered pair and does not call fetch", () => {
    expect(() =>
      evaluateSimulationLab({
        disruptionId: "delay",
        responseId: "cold-recovery",
      })
    ).toThrow(/not a registered comparison/);
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (() => {
      calls += 1;
      throw new Error("fetch");
    }) as typeof fetch;
    try {
      evaluateSimulationLab({
        disruptionId: "breakdown",
        responseId: "no-action",
      });
      expect(calls).toBe(0);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("does not import persistence modules", () => {
    const source = readFileSync("lib/domain/simulation-lab.ts", "utf8");
    const component = readFileSync(
      "components/simulation/SimulationLab.tsx",
      "utf8"
    );
    expect(source).not.toMatch(
      /prisma|getPrisma|\/api\/shipments|\/api\/reservations/
    );
    expect(component).not.toMatch(/fetch\(|prisma|getPrisma/);
  });

  it("renders the in-memory notice and the canonical delta", () => {
    const html = renderToStaticMarkup(
      createElement(SimulationLab, {
        disruptionId: "breakdown",
        responseId: "cold-recovery",
      })
    );
    expect(html).toContain(
      "does not create or change a shipment or reservation"
    );
    expect(html).toContain("1,44,330.67");
    expect(html).toContain("₹38/km");
    expect(html).toContain("₹72/km");
    expect(html).toContain('data-persisted="false"');
  });
});
