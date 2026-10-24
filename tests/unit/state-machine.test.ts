import { describe, expect, it } from "vitest";

import {
  assertChronological,
  canTransitionShipment,
} from "@/lib/domain/state-machine";

describe("normal shipment transitions", () => {
  it("allows only the delivery path in order", () => {
    expect(canTransitionShipment("BOOKED", "DISPATCHED")).toBe(true);
    expect(canTransitionShipment("DISPATCHED", "IN_TRANSIT")).toBe(true);
    expect(canTransitionShipment("IN_TRANSIT", "DELIVERED")).toBe(true);
    expect(canTransitionShipment("BOOKED", "DELIVERED")).toBe(false);
    expect(canTransitionShipment("DELIVERED", "DISPATCHED")).toBe(false);
    expect(canTransitionShipment("IN_TRANSIT", "BOOKED")).toBe(false);
  });

  it("rejects an event that precedes the previous milestone", () => {
    const earlier = new Date("2026-10-25T07:00:00.000Z");
    const later = new Date("2026-10-25T08:00:00.000Z");
    expect(assertChronological(earlier, later)).toBe(true);
    expect(assertChronological(later, earlier)).toBe(false);
  });
});
