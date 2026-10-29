import { describe, expect, it } from "vitest";

import { nextNormalStatus } from "@/components/shipments/ShipmentAdvance";

describe("stored shipment advance", () => {
  it("follows only the normal path", () => {
    expect(nextNormalStatus("BOOKED")).toBe("DISPATCHED");
    expect(nextNormalStatus("DISPATCHED")).toBe("IN_TRANSIT");
    expect(nextNormalStatus("IN_TRANSIT")).toBe("DELIVERED");
    expect(nextNormalStatus("DELIVERED")).toBeNull();
    expect(nextNormalStatus("DISRUPTED")).toBeNull();
    expect(nextNormalStatus("REROUTED")).toBeNull();
  });
});
