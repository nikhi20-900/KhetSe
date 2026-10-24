import { describe, expect, it } from "vitest";
import {
  createDemoFormValues,
  toHarvestIntake,
  type HarvestFormValues,
} from "@/lib/planning/intake-form";

const now = new Date("2026-10-24T08:00:00.000Z");

function values(overrides: Partial<HarvestFormValues> = {}): HarvestFormValues {
  return { ...createDemoFormValues(now), ...overrides };
}

describe("harvest intake schema", () => {
  it("accepts the demonstration lot", () => {
    const result = toHarvestIntake(values(), now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.intake.quantityKg).toBe(10000);
    expect(result.intake.cropType).toBe("Nashik Red Onion");
    expect(result.intake.declaredQualityGrade).toBe("Grade A");
    expect(result.intake.temperatureRequirementC).toEqual({ min: 24, max: 32 });
    expect(result.intake.maxShelfLifeHours).toBe(96);
    expect(result.intake.originLocation.name).toContain("Pimpalgaon Baswant");
  });

  it("reports missing fields and invalid formats", () => {
    const result = toHarvestIntake(
      {
        cropType: "",
        quantityKg: "",
        originName: " ",
        latitude: "",
        longitude: "",
        harvestCompletedAt: "",
        declaredQualityGrade: "",
        temperatureMinC: "",
        temperatureMaxC: "",
        maxShelfLifeHours: "",
      },
      now
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.cropType).toBe("Crop type is required.");
    expect(result.errors.quantityKg).toBeTruthy();
    expect(result.errors.originName).toBe("Origin location is required.");
    expect(result.errors.latitude).toBeTruthy();
    expect(result.errors.longitude).toBeTruthy();
    expect(result.errors.harvestCompletedAt).toBeTruthy();
    expect(result.errors.declaredQualityGrade).toBe(
      "Choose Grade A, Grade B, or Grade C."
    );
    expect(result.errors.temperatureMinC).toBeTruthy();
    expect(result.errors.maxShelfLifeHours).toBeTruthy();
  });

  it("rejects volume, temperature, and date values outside bounds", () => {
    const zero = toHarvestIntake(values({ quantityKg: "0" }), now);
    const huge = toHarvestIntake(values({ quantityKg: "100001" }), now);
    const letters = toHarvestIntake(values({ quantityKg: "10kg" }), now);
    const reversed = toHarvestIntake(
      values({ temperatureMinC: "30", temperatureMaxC: "20" }),
      now
    );
    const hot = toHarvestIntake(values({ temperatureMaxC: "60" }), now);
    const stale = toHarvestIntake(
      values({
        harvestCompletedAt: new Date(
          now.getTime() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
      now
    );
    const farFuture = toHarvestIntake(
      values({
        harvestCompletedAt: new Date(
          now.getTime() + 31 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
      now
    );
    const nonsense = toHarvestIntake(
      values({ harvestCompletedAt: "yesterday" }),
      now
    );

    expect(zero.ok).toBe(false);
    expect(huge.ok).toBe(false);
    expect(letters.ok).toBe(false);
    expect(reversed.ok).toBe(false);
    expect(hot.ok).toBe(false);
    expect(stale.ok).toBe(false);
    expect(farFuture.ok).toBe(false);
    expect(nonsense.ok).toBe(false);
    if (!zero.ok)
      expect(zero.errors.quantityKg).toBe(
        "Harvest volume must be greater than 0 kg."
      );
    if (!huge.ok)
      expect(huge.errors.quantityKg).toBe(
        "Harvest volume cannot exceed 100,000 kg."
      );
    if (!reversed.ok) {
      expect(reversed.errors.temperatureMaxC).toBe(
        "Minimum temperature must be lower than the maximum."
      );
    }
    if (!stale.ok) {
      expect(stale.errors.harvestCompletedAt).toBe(
        "Harvest completion time cannot be more than 7 days in the past."
      );
    }
    if (!farFuture.ok) {
      expect(farFuture.errors.harvestCompletedAt).toBe(
        "Harvest completion time cannot be more than 30 days in the future."
      );
    }
  });
});
