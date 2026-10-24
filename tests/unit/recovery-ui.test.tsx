import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DisruptionAlertBanner } from "@/components/incidents/DisruptionAlertBanner";
import { NoActionCard } from "@/components/incidents/NoActionCard";
import { RecoveryOptionCard } from "@/components/incidents/RecoveryOptionCard";
import { ShipmentTimeline } from "@/components/shipments/ShipmentTimeline";
import { createDemoOperations, injectBreakdown } from "@/lib/domain/recovery";

describe("disruption presentation", () => {
  const state = injectBreakdown(createDemoOperations());
  const incident = state.incident;
  if (!incident) throw new Error("Expected the simulated incident");

  it("shows the breakdown with urgency on the timeline and banner", () => {
    const banner = renderToStaticMarkup(
      createElement(DisruptionAlertBanner, { incident })
    );
    const timeline = renderToStaticMarkup(
      createElement(ShipmentTimeline, { events: state.shipment.events })
    );
    expect(banner).toContain("Simulated incident");
    expect(banner).toContain("Vehicle breakdown");
    expect(banner).toContain("modeled estimate");
    expect(timeline).toContain("Urgent:");
    expect(timeline).toContain("Simulated vehicle breakdown");
  });

  it("renders no action and a capacity rejection", () => {
    const overloaded = createDemoOperations();
    overloaded.shipment = { ...overloaded.shipment, quantityKg: 60_000 };
    const rejectedIncident = injectBreakdown(overloaded).incident;
    const noAction = rejectedIncident?.options.find(
      (option) => option.kind === "NO_ACTION"
    );
    const rejected = rejectedIncident?.options.find(
      (option) => !option.feasible
    );
    if (!noAction || !rejected?.rejection)
      throw new Error("Expected no action and a rejection");
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(NoActionCard, { option: noAction }),
        rejected
          ? createElement(RecoveryOptionCard, { option: rejected })
          : null
      )
    );
    expect(html).toContain("No action");
    expect(html).toContain("No-action baseline");
    expect(html).toContain("original truck booking stays in place");
    expect(html).toContain(rejected.rejection.category);
    expect(html).toContain("Capacity Mismatch");
  });
});
