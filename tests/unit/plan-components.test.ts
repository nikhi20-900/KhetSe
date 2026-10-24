import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { REJECTION_CATEGORIES } from "@/lib/contracts/plan.contract";
import { evaluateLogisticsPlans } from "@/lib/domain/feasibility";
import { createDemoIntake } from "@/lib/planning/intake-form";
import { CostBreakdownTable } from "@/components/planning/CostBreakdownTable";
import { ConstraintRejectionBadge } from "@/components/planning/ConstraintRejectionBadge";
import { PlanComparisonCard } from "@/components/planning/PlanComparisonCard";

const now = new Date("2026-10-24T08:00:00.000Z");

describe("plan presentation", () => {
  const evaluation = evaluateLogisticsPlans(createDemoIntake(now));
  const featured = evaluation.featuredPlanIds
    .map((planId) =>
      evaluation.feasiblePlans.find((plan) => plan.planId === planId)
    )
    .filter((plan) => plan !== undefined);

  it("renders comparison cards with objective, route, and modeled transit", () => {
    const html = featured
      .map((plan) =>
        renderToStaticMarkup(createElement(PlanComparisonCard, { plan }))
      )
      .join("\n");

    expect(html).toContain("Fastest Transit");
    expect(html).toContain("Lowest Cost");
    expect(html).toContain("Maximum Estimated Proceeds");
    expect(html).toContain("Modeled transit");
    expect(html).toContain("Modeled estimate");
    expect(html).toContain("All amounts are modeled estimates.");
  });

  it("renders the cost breakdown with transport, handling, storage, and returns", () => {
    const plan = featured[0];
    if (!plan) throw new Error("Expected a featured plan");
    const html = renderToStaticMarkup(
      createElement(CostBreakdownTable, { breakdown: plan.breakdown })
    );

    expect(html).toContain("Transport");
    expect(html).toContain("Handling");
    expect(html).toContain("Storage");
    expect(html).toContain("Expected gross proceeds");
    expect(html).toContain("Estimated net return");
    expect(html).toContain("All amounts are modeled estimates.");
    expect(html).toContain("Amount (modeled estimate)");
  });

  it("renders rejection badges with specific constraint reasons", () => {
    const rejection = evaluation.rejectedPlans
      .flatMap((plan) => plan.rejections)
      .find((item) => item.category === REJECTION_CATEGORIES.CAPACITY_MISMATCH);
    if (!rejection) throw new Error("Expected a capacity rejection");
    const html = renderToStaticMarkup(
      createElement(ConstraintRejectionBadge, { rejection })
    );
    expect(html).toContain(REJECTION_CATEGORIES.CAPACITY_MISMATCH);
    expect(html).toContain("7,500 kg");
    expect(html).toContain("Reefer");
  });
});
