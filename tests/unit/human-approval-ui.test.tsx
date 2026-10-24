import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import {
  canRecordRecoveryDecision,
  HumanApprovalModal,
} from "@/components/incidents/HumanApprovalModal";
import { createDemoOperations, injectBreakdown } from "@/lib/domain/recovery";

const incident = injectBreakdown(createDemoOperations()).incident;
if (!incident) throw new Error("Expected the simulated incident.");
const options = incident.options;
const recoveryOption = options.find(
  (option) => option.feasible && option.kind !== "NO_ACTION"
);
if (!recoveryOption) throw new Error("Expected a feasible recovery option.");

describe("human approval UI", () => {
  it("keeps the decision action disabled until approval inputs satisfy the contract", () => {
    const html = renderToStaticMarkup(
      createElement(HumanApprovalModal, {
        incidentId: incident.id,
        options,
      })
    );
    expect(html).toContain("I explicitly approve this choice");
    expect(html).toContain("Buyer or manager (required)");
    expect(html).toContain("Record decision");
    expect(html).toContain('type="submit" disabled=""');
  });

  it("requires explicit approval, a named approver, and the required manager sign-off", () => {
    const base = {
      incidentId: incident.id,
      selected: recoveryOption,
      approvedBy: "Harvest coordinator",
      managerApprovedBy: "Market manager",
      approvalNotes: "",
      confirmDecision: true,
    };
    expect(canRecordRecoveryDecision({ ...base, confirmDecision: false })).toBe(
      false
    );
    expect(canRecordRecoveryDecision({ ...base, approvedBy: " A " })).toBe(
      false
    );
    expect(canRecordRecoveryDecision({ ...base, managerApprovedBy: " " })).toBe(
      false
    );
    expect(canRecordRecoveryDecision(base)).toBe(true);
  });

  it("does not allow an unavailable recovery option to be approved", () => {
    const overloaded = createDemoOperations();
    overloaded.shipment = { ...overloaded.shipment, quantityKg: 60_000 };
    const unavailable = injectBreakdown(overloaded).incident?.options.find(
      (option) => !option.feasible
    );
    if (!unavailable) throw new Error("Expected an unavailable option.");
    expect(
      canRecordRecoveryDecision({
        incidentId: incident.id,
        selected: unavailable,
        approvedBy: "Harvest coordinator",
        managerApprovedBy: "Market manager",
        approvalNotes: "",
        confirmDecision: true,
      })
    ).toBe(false);
  });
});
