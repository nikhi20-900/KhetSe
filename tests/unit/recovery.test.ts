import { describe, expect, it } from "vitest";

import { DEMO_INCIDENT_ID } from "@/lib/contracts/incident.contract";
import {
  applyRecoveryDecision,
  buildRecoveryOptions,
  createDemoOperations,
  injectBreakdown,
  type RecoveryDecision,
} from "@/lib/domain/recovery";
import { executeApprovedRecovery } from "@/lib/operations/recovery-service";

function decision(overrides: Partial<RecoveryDecision> = {}): RecoveryDecision {
  return {
    incidentId: DEMO_INCIDENT_ID,
    action: "APPROVE_RECOVERY_PLAN",
    selectedRecoveryPlanId: "rec_nashik-demo-cold",
    approvedBy: "Harvest coordinator",
    confirmDecision: true,
    managerApprovedBy: "Market manager",
    approvalNotes: "Hold confirmed.",
    decidedAt: "2026-10-25T17:00:00.000Z",
    ...overrides,
  };
}

describe("disruption recovery", () => {
  it("always includes no action and prices the cold stores from the register", () => {
    const incident = injectBreakdown(createDemoOperations()).incident;
    expect(incident).not.toBeNull();
    const options = incident?.options ?? [];
    expect(
      options.some((option) => option.kind === "NO_ACTION" && option.feasible)
    ).toBe(true);
    expect(options.map((option) => option.id)).toEqual([
      "rec_nashik-demo-cold",
      "rec_vashi-demo-cold",
      "rec_no_action",
    ]);
    expect(options[0]?.modeledCostInr).toBe(2_800 + 38 * 10);
    expect(options[0]?.costBasis).toContain("₹38");
    expect(options[1]?.feasible).toBe(false);
    expect(options[1]?.modeledCostInr).toBeNull();
    expect(incident && incident.remainingShelfLifeHours).toBeGreaterThan(0);
  });

  it("rejects storage that cannot hold the load and still offers no action", () => {
    const state = createDemoOperations();
    state.shipment = { ...state.shipment, quantityKg: 60_000 };
    const options = buildRecoveryOptions(state, 10);
    expect(
      options
        .filter((option) => option.kind === "STORAGE_REROUTE")
        .every((option) => !option.feasible)
    ).toBe(true);
    expect(options.at(-1)?.kind).toBe("NO_ACTION");
  });

  it("does not change the booking without explicit approval", () => {
    const state = injectBreakdown(createDemoOperations());
    const result = applyRecoveryDecision(
      state,
      decision({ confirmDecision: false })
    );
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(state.reservation.resourceId).toBe("standard-10t");
    expect(state.audit).toHaveLength(0);
    expect(state.shipment.status).toBe("DISRUPTED");
  });

  it("requires a buyer or manager when the receiving window changes", () => {
    const state = injectBreakdown(createDemoOperations());
    const result = applyRecoveryDecision(
      state,
      decision({ managerApprovedBy: " " })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
    expect(result.state).toBe(state);
    expect(state.reservation.id).toBe("res_demo_truck");
  });

  it("does not execute a reroute that has no PostgreSQL reservation", async () => {
    const state = injectBreakdown(createDemoOperations());
    const result = await executeApprovedRecovery(state, decision());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(state.shipment.status).toBe("DISRUPTED");
    expect(state.reservation.postgresReservationId).toBeNull();
    expect(state.audit).toHaveLength(0);
  });

  it("does not mark the recovery executed before the swap is confirmed", () => {
    const state = injectBreakdown(createDemoOperations());
    const result = applyRecoveryDecision(state, decision());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.executed).toBe(false);
    expect(result.state).toBe(state);
    expect(state.shipment.status).toBe("DISRUPTED");
    expect(state.reservation.resourceId).toBe("standard-10t");
    expect(state.audit).toHaveLength(0);
    expect(result.pendingSwap).toEqual({
      transportSlotId: "ventilated-10t",
      storageFacilityId: "nashik-demo-cold",
    });
  });

  it("records the reroute only after a confirmed swap id is supplied", () => {
    const state = injectBreakdown(createDemoOperations());
    const result = applyRecoveryDecision(state, decision(), {
      nextReservationId: "res_swapped",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.executed).toBe(true);
    expect(result.state).not.toBe(state);
    expect(result.state.shipment.status).toBe("REROUTED");
    expect(result.state.reservation.id).toBe("res_swapped");
    expect(result.state.reservation.postgresReservationId).toBe("res_swapped");
    expect(result.state.reservation.resourceId).toBe("nashik-demo-cold");
    expect(result.state.audit).toHaveLength(1);
    expect(result.state.audit[0]?.reservationBefore.resourceId).toBe(
      "standard-10t"
    );
    expect(result.state.audit[0]?.reservationAfter.resourceId).toBe(
      "nashik-demo-cold"
    );

    const repeat = applyRecoveryDecision(result.state, decision());
    expect(repeat.ok && repeat.idempotent && repeat.executed).toBe(true);
    expect(repeat.ok && repeat.state).toBe(result.state);
  });

  it("keeps the original booking when no action is approved", () => {
    const state = injectBreakdown(createDemoOperations());
    const result = applyRecoveryDecision(
      state,
      decision({
        action: "SELECT_NO_ACTION",
        selectedRecoveryPlanId: "rec_no_action",
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.shipment.status).toBe("DISRUPTED");
    expect(result.state.reservation).toEqual(state.reservation);
    expect(
      result.state.resources.find((item) => item.id === "nashik-demo-cold")
        ?.availableKg
    ).toBe(12_000);
  });

  it("leaves the booking untouched when the cold store is no longer available", () => {
    const state = injectBreakdown(createDemoOperations());
    const depleted = {
      ...state,
      resources: state.resources.map((resource) =>
        resource.id === "nashik-demo-cold"
          ? { ...resource, availableKg: 0 }
          : resource
      ),
    };
    const result = applyRecoveryDecision(depleted, decision());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.state).toBe(depleted);
    expect(depleted.reservation.resourceId).toBe("standard-10t");
    expect(depleted.shipment.status).toBe("DISRUPTED");
    expect(depleted.audit).toHaveLength(0);
    expect(
      depleted.resources.find((item) => item.id === "standard-10t")?.availableKg
    ).toBe(0);
  });
});
