import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST as createReservation } from "@/app/api/reservations/route";
import { POST as createShipment } from "@/app/api/shipments/route";
import { GET as readShipment } from "@/app/api/shipments/[id]/route";
import { POST as transitionShipment } from "@/app/api/shipments/[id]/transitions/route";

const previousDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousDatabaseUrl;
});

describe("database-backed API failures", () => {
  it("returns a structured unavailable response for capacity and shipment writes", async () => {
    const responses = await Promise.all([
      createReservation(
        new Request("http://localhost/api/reservations", {
          method: "POST",
          body: "{}",
        })
      ),
      createShipment(
        new Request("http://localhost/api/shipments", {
          method: "POST",
          body: "{}",
        })
      ),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(503);
      expect(response.headers.get("content-type")).toContain(
        "application/problem+json"
      );
      expect(await response.json()).toMatchObject({
        status: 503,
        title: "Database unavailable",
      });
    }
  });

  it("returns unavailable for shipment reads and transitions without touching a record", async () => {
    const context = { params: Promise.resolve({ id: "ship_read_only_probe" }) };
    const [read, transition] = await Promise.all([
      readShipment(
        new Request("http://localhost/api/shipments/ship_read_only_probe"),
        context
      ),
      transitionShipment(
        new Request(
          "http://localhost/api/shipments/ship_read_only_probe/transitions",
          { method: "POST", body: "{}" }
        ),
        context
      ),
    ]);

    expect(read.status).toBe(503);
    expect(transition.status).toBe(503);
    expect(await read.json()).toMatchObject({
      status: 503,
      instance: "/api/shipments/ship_read_only_probe",
    });
    expect(await transition.json()).toMatchObject({
      status: 503,
      instance: "/api/shipments/ship_read_only_probe/transitions",
    });
  });
});
