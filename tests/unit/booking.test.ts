import { describe, expect, it } from "vitest";

import {
  canTransition,
  dailySlotRateInr,
  slotsForKilograms,
  vehicleIdFromPlanKey,
} from "@/lib/domain/booking";

describe("booking invariants", () => {
  it("maps kilograms onto whole storage slots", () => {
    expect(slotsForKilograms(10_000, 1_000)).toBe(10);
    expect(slotsForKilograms(10_001, 1_000)).toBe(11);
    expect(dailySlotRateInr(0.015)).toBe(360);
  });

  it("allows only the reservation lifecycle transitions", () => {
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "CONSUMED")).toBe(true);
    expect(canTransition("CONFIRMED", "EXPIRED")).toBe(true);
    expect(canTransition("CONSUMED", "CANCELLED")).toBe(false);
    expect(canTransition("EXPIRED", "CONFIRMED")).toBe(false);
  });

  it("recognises the demonstration plan keys", () => {
    expect(vehicleIdFromPlanKey("plan_vashi_ventilated_10t")).toBe(
      "ventilated-10t"
    );
    expect(vehicleIdFromPlanKey("plan_vashi_standard_10t")).toBe(
      "standard-10t"
    );
    expect(vehicleIdFromPlanKey("plan_vashi_reefer_7_5t")).toBe("reefer-van");
  });
});
