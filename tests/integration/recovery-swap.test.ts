import { spawn } from "child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";

import { DEMO_INCIDENT_ID } from "@/lib/contracts/incident.contract";
import { disconnectPrisma } from "@/lib/db/client";
import { bookCapacity, getReservation } from "@/lib/db/queries/reservations";
import { createDemoOperations, injectBreakdown } from "@/lib/domain/recovery";
import { executeApprovedRecovery } from "@/lib/operations/recovery-service";

describe("recovery approval uses the PostgreSQL swap", () => {
  let server: PGLiteSocketServer;
  let db: PrismaClient;

  beforeAll(async () => {
    const pglite = await PGlite.create();
    server = new PGLiteSocketServer({
      db: pglite,
      port: 55435,
      host: "127.0.0.1",
      maxConnections: 8,
    });
    await server.start();
    process.env.DATABASE_URL = `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable&connection_limit=4`;
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "npx",
        ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
        { env: process.env, stdio: ["ignore", "pipe", "pipe"] }
      );
      let stderr = "";
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(stderr))
      );
    });
    db = new PrismaClient();
    await db.transportSlot.createMany({
      data: [
        {
          id: "standard-10t",
          vehicleType: "Standard 10-T truck",
          capacityKg: 10_000,
          availableKg: 10_000,
          costPerKmInr: 32,
          departureWindow: new Date("2026-10-25T14:00:00.000Z"),
        },
        {
          id: "ventilated-10t",
          vehicleType: "Ventilated truck",
          capacityKg: 10_000,
          availableKg: 10_000,
          costPerKmInr: 38,
          departureWindow: new Date("2026-10-25T14:00:00.000Z"),
        },
      ],
    });
    await db.storageFacility.create({
      data: {
        id: "nashik-demo-cold",
        name: "Nashik demo cold room",
        location: "nashik-cold",
        totalSlots: 2,
        freeSlots: 2,
        kgPerSlot: 1_000,
        tempMinC: 5,
        tempMaxC: 5,
        dailyRateInr: 360,
      },
    });
  }, 60_000);

  afterAll(async () => {
    await db?.$disconnect();
    await disconnectPrisma();
    await server?.stop();
  });

  it("leaves the original reservation confirmed when the swap cannot fit", async () => {
    const booked = await bookCapacity(
      {
        planId: "plan_breakdown",
        allocatedKg: 10_000,
        lockDurationMinutes: 30,
        transportSlotId: "standard-10t",
        idempotencyKey: "recovery-original",
      },
      db
    );
    const state = injectBreakdown(createDemoOperations());
    state.reservation = {
      ...state.reservation,
      postgresReservationId: booked.reservationId,
    };
    const result = await executeApprovedRecovery(
      state,
      {
        incidentId: DEMO_INCIDENT_ID,
        action: "APPROVE_RECOVERY_PLAN",
        selectedRecoveryPlanId: "rec_nashik-demo-cold",
        approvedBy: "Harvest coordinator",
        confirmDecision: true,
        managerApprovedBy: "Market manager",
        decidedAt: "2026-10-25T17:00:00.000Z",
      },
      db
    );
    expect(result.ok).toBe(false);
    expect(state.shipment.status).toBe("DISRUPTED");
    expect(state.audit).toHaveLength(0);
    const original = await getReservation(booked.reservationId, db);
    expect(original.status).toBe("CONFIRMED");
    expect(original.transportSlotId).toBe("standard-10t");
    expect(original.storageFacilityId).toBeNull();
    expect(
      (
        await db.transportSlot.findUniqueOrThrow({
          where: { id: "standard-10t" },
        })
      ).availableKg
    ).toBe(0);
    expect(
      (
        await db.storageFacility.findUniqueOrThrow({
          where: { id: "nashik-demo-cold" },
        })
      ).freeSlots
    ).toBe(2);
  });

  it("records the reroute only after the swap commits", async () => {
    await db.storageFacility.update({
      where: { id: "nashik-demo-cold" },
      data: { totalSlots: 20, freeSlots: 12 },
    });
    const original = await db.reservation.findFirstOrThrow({
      where: { requestedPlanKey: "plan_breakdown", status: "CONFIRMED" },
    });
    const state = injectBreakdown(createDemoOperations());
    state.reservation = {
      ...state.reservation,
      postgresReservationId: original.id,
    };
    const result = await executeApprovedRecovery(
      state,
      {
        incidentId: DEMO_INCIDENT_ID,
        action: "APPROVE_RECOVERY_PLAN",
        selectedRecoveryPlanId: "rec_nashik-demo-cold",
        approvedBy: "Harvest coordinator",
        confirmDecision: true,
        managerApprovedBy: "Market manager",
        decidedAt: "2026-10-25T17:10:00.000Z",
      },
      db
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.shipment.status).toBe("REROUTED");
    expect(result.body.reservation.id).not.toBe(original.id);
    const held = await getReservation(result.body.reservation.id, db);
    expect(held.status).toBe("CONFIRMED");
    expect(held.transportSlotId).toBe("ventilated-10t");
    expect(held.storageFacilityId).toBe("nashik-demo-cold");
    expect((await getReservation(original.id, db)).status).toBe("CANCELLED");
    expect(
      (
        await db.transportSlot.findUniqueOrThrow({
          where: { id: "standard-10t" },
        })
      ).availableKg
    ).toBe(10_000);
    expect(
      (
        await db.transportSlot.findUniqueOrThrow({
          where: { id: "ventilated-10t" },
        })
      ).availableKg
    ).toBe(0);
  });
});
