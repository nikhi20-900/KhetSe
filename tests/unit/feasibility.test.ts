import { describe, expect, it } from "vitest";
import {
  REJECTION_CATEGORIES,
  REJECTION_CODES,
} from "@/lib/contracts/plan.contract";
import { evaluateLogisticsPlans } from "@/lib/domain/feasibility";
import { createDemoIntake } from "@/lib/planning/intake-form";

const now = new Date("2026-10-24T08:00:00.000Z");

describe("logistics feasibility", () => {
  it("ranks modeled plans and explains the reefer capacity rejection", () => {
    const evaluation = evaluateLogisticsPlans(createDemoIntake(now));
    expect(evaluation.estimateLabel).toBe("Modeled estimate");
    expect(evaluation.featuredPlanIds.length).toBeGreaterThanOrEqual(3);

    const featured = evaluation.featuredPlanIds.map((planId) =>
      evaluation.feasiblePlans.find((plan) => plan.planId === planId)
    );
    const labels = featured.flatMap((plan) => plan?.objectiveLabels ?? []);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Fastest Transit",
        "Lowest Cost",
        "Maximum Estimated Proceeds",
      ])
    );

    for (const plan of evaluation.feasiblePlans) {
      const breakdown = plan.breakdown;
      expect(breakdown.logisticsTotalInr).toBe(
        breakdown.transportInr + breakdown.handlingInr + breakdown.storageInr
      );
      expect(plan.expectedNetProceedsInr).toBe(breakdown.netProceedsInr);
      expect(Number.isInteger(breakdown.netProceedsInr)).toBe(true);
    }

    const capacity = evaluation.rejectedPlans.find((plan) =>
      plan.rejections.some(
        (rejection) => rejection.code === REJECTION_CODES.CAPACITY_MISMATCH
      )
    );
    expect(capacity?.rejections[0]?.category).toBe(
      REJECTION_CATEGORIES.CAPACITY_MISMATCH
    );
    expect(capacity?.rejections[0]?.message).toContain("10,000 kg");
    expect(capacity?.rejections[0]?.message).toContain("7,500 kg");
    expect(capacity?.transportMode).toContain("Reefer");
    expect(
      capacity?.rejections.some(
        (rejection) =>
          rejection.code === REJECTION_CODES.THERMAL_INCOMPATIBILITY
      )
    ).toBe(true);

    const fastest = evaluation.feasiblePlans.find(
      (plan) => plan.planId === evaluation.featuredPlanIds[0]
    );
    const cheapest = evaluation.feasiblePlans.find((plan) =>
      plan.objectiveLabels.includes("Lowest Cost")
    );
    const richest = evaluation.feasiblePlans.find((plan) =>
      plan.objectiveLabels.includes("Maximum Estimated Proceeds")
    );
    expect(fastest?.planId).toBe("plan_vashi_ventilated_10t");
    expect(cheapest?.estimatedLogisticsCostInr).toBe(16_175);
    expect(cheapest?.expectedGrossProceedsInr).toBe(277_200);
    expect(cheapest?.expectedNetProceedsInr).toBe(261_025);
    expect(richest?.planId).toBe("plan_pune_standard_10t");
    expect(richest?.expectedGrossProceedsInr).toBe(306_745);
    expect(richest?.expectedNetProceedsInr).toBe(289_270);
  });

  it("rejects a short shelf life that misses the next receiving window", () => {
    const intake = createDemoIntake(now);
    const evaluation = evaluateLogisticsPlans({
      ...intake,
      maxShelfLifeHours: 10,
    });
    const vashi = evaluation.rejectedPlans.find(
      (plan) => plan.planId === "plan_vashi_ventilated_10t"
    );
    expect(vashi?.rejections[0]?.code).toBe(REJECTION_CODES.WINDOW_EXPIRED);
    expect(vashi?.rejections[0]?.category).toBe(
      REJECTION_CATEGORIES.WINDOW_EXPIRED
    );
    expect(evaluation.feasiblePlans).toHaveLength(0);
  });

  it("rejects ambient trucks when the declared band only fits a reefer", () => {
    const intake = createDemoIntake(now);
    const evaluation = evaluateLogisticsPlans({
      ...intake,
      quantityKg: 7_000,
      temperatureRequirementC: { min: 0, max: 5 },
    });
    const ventilated = evaluation.rejectedPlans.find(
      (plan) => plan.planId === "plan_vashi_ventilated_10t"
    );
    const reefer = evaluation.feasiblePlans.find(
      (plan) => plan.planId === "plan_vashi_reefer_7_5t"
    );
    expect(ventilated?.rejections[0]?.code).toBe(
      REJECTION_CODES.THERMAL_INCOMPATIBILITY
    );
    expect(reefer?.breakdown.lossModel).toBe("ambient_wait_only");
    expect(reefer?.feasibility.isFeasible).toBe(true);
  });
});
