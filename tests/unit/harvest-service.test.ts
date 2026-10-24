import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDemoIntake } from "@/lib/planning/intake-form";
import { generatePlans, registerHarvest } from "@/lib/planning/harvest-service";

const now = new Date("2026-10-24T08:00:00.000Z");

describe("harvest and plan services", () => {
  const previous = process.env.KHETSE_DATA_DIR;

  beforeEach(() => {
    process.env.KHETSE_DATA_DIR = mkdtempSync(path.join(tmpdir(), "khetse-"));
  });

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.KHETSE_DATA_DIR;
    } else {
      process.env.KHETSE_DATA_DIR = previous;
    }
  });

  it("registers a valid harvest and ranks plans for it", () => {
    const created = registerHarvest(createDemoIntake(now), now);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.status).toBe(201);
    expect(created.body.harvestId.startsWith("harv_")).toBe(true);
    expect(created.body.status).toBe("REGISTERED");

    const plans = generatePlans({ harvestId: created.body.harvestId });
    expect(plans.ok).toBe(true);
    if (!plans.ok) return;
    expect(plans.body.feasiblePlans.length).toBeGreaterThanOrEqual(3);
    expect(
      plans.body.rejectedPlans.some((plan) =>
        plan.transportMode.includes("Reefer")
      )
    ).toBe(true);
  });

  it("returns field errors for an invalid intake", () => {
    const created = registerHarvest({ quantityKg: -5 }, now);
    expect(created.ok).toBe(false);
    if (created.ok) return;
    expect(created.status).toBe(422);
    expect(
      created.body.errors?.some((error) => error.path === "quantityKg")
    ).toBe(true);
  });

  it("returns not found for an unknown harvest", () => {
    const plans = generatePlans({ harvestId: "harv_missing" });
    expect(plans.ok).toBe(false);
    if (plans.ok) return;
    expect(plans.status).toBe(404);
  });
});
