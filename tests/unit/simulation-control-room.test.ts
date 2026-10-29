import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/simulation/preview/route";
import { ControlRoom } from "@/components/simulation/ControlRoom";
import { buildControlRoom } from "@/lib/domain/simulation-control-room";
import { SimulationLabError } from "@/lib/domain/simulation-lab";

function option(
  incidentId: "breakdown" | "delay" | "temperature" | "storage-rejection",
  choiceId: "repair" | "reroute" | "no-action" | "counterexample"
) {
  const preview = buildControlRoom();
  const incident = preview.incidents.find((item) => item.id === incidentId);
  const found = incident?.options.find((item) => item.id === choiceId);
  if (!incident || !found) throw new Error(`Missing ${incidentId} ${choiceId}`);
  return found;
}

describe("simulation control room", () => {
  it("prices the default Nashik onion preview from the canonical engine", () => {
    const preview = buildControlRoom();
    expect(preview.persisted).toBe(false);
    expect(preview.quantityKg).toBe(10_000);
    expect(preview.destinationId).toBe("pune");
    expect(option("breakdown", "reroute").deltaInr).toBe(144330.67);
    expect(option("breakdown", "no-action").deltaInr).toBe(0);
    expect(option("breakdown", "counterexample").deltaInr).toBe(-204069.2);
    expect(option("breakdown", "repair").deltaInr).toBeGreaterThan(0);
    expect(preview.storage.vashiFeasible).toBe(false);
    expect(preview.storage.nashikFeasible).toBe(true);
    expect(buildControlRoom()).toEqual(preview);
  });

  it("rejects invalid setup and unsupported trucks without inventing a price", () => {
    expect(() => buildControlRoom({ quantityKg: 0 })).toThrow(
      SimulationLabError
    );
    expect(() => buildControlRoom({ quantityKg: 10_001 })).toThrow(
      /1 to 10000/
    );
    expect(() => buildControlRoom({ cropType: "Wheat" })).toThrow(/Nashik/);
    expect(() => buildControlRoom({ originId: "surat" })).toThrow(/Pimpalgaon/);
    expect(() => buildControlRoom({ destinationId: "surat" })).toThrow(
      /unsupported/
    );
    expect(() => buildControlRoom({ vehicleId: "reefer-van" })).toThrow(
      /standard 10-t/i
    );
    expect(option("delay", "repair").feasible).toBe(false);
    expect(option("temperature", "reroute").feasible).toBe(false);
    expect(option("storage-rejection", "repair").feasible).toBe(false);
  });

  it("recalculates delay and temperature from registered pause steps", () => {
    const registered = option("delay", "no-action");
    const longer = buildControlRoom({ delayHours: 16 })
      .incidents.find((item) => item.id === "delay")
      ?.options.find((item) => item.id === "no-action");
    expect(longer?.netProceedsInr).not.toBe(registered.netProceedsInr);
    const hot = option("temperature", "repair");
    const repair = option("breakdown", "repair");
    expect(hot.netProceedsInr).not.toBe(repair.netProceedsInr);
    expect(hot.unsupportedReason).toBeNull();
  });

  it("does not import persistence from the preview path", () => {
    const sources = [
      "lib/domain/simulation-control-room.ts",
      "lib/domain/simulation-lab.ts",
      "app/api/simulation/preview/route.ts",
      "components/simulation/ControlRoom.tsx",
    ];
    for (const path of sources) {
      const source = readFileSync(path, "utf8");
      expect(source).not.toMatch(
        /prisma|getPrisma|\/api\/shipments|\/api\/reservations/
      );
    }
  });

  it("returns the preview from the read-only route", async () => {
    const response = await GET(
      new Request("http://127.0.0.1/api/simulation/preview")
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { persisted: boolean };
    expect(body.persisted).toBe(false);
    const rejected = await GET(
      new Request(
        "http://127.0.0.1/api/simulation/preview?vehicleId=reefer-van"
      )
    );
    expect(rejected.status).toBe(422);
  });

  it("renders the control room without claiming the preview was stored", () => {
    const html = renderToStaticMarkup(
      createElement(ControlRoom, { preview: buildControlRoom() })
    );
    expect(html).toContain("Simulation Lab");
    expect(html).toContain("10,000 kg");
    expect(html).toContain(
      "does not create or change a shipment or reservation"
    );
    expect(html).toContain("1,44,330.67");
    expect(html).toContain("Vashi demo cold room cannot take");
    expect(html).toContain('data-persisted="false"');
  });
});
