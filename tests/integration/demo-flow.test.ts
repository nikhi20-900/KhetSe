import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { spawn } from "child_process";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";

import { getShipmentReportRows } from "@/lib/contracts/report.contract";
import { disconnectPrisma } from "@/lib/db/client";
import { bookCapacity } from "@/lib/db/queries/reservations";
import { replayDemoScenario } from "@/lib/db/queries/scenarios";
import { recordShipmentDisruption } from "@/lib/db/queries/shipment-recovery";
import {
  createShipment,
  getShipment,
  transitionShipment,
} from "@/lib/db/queries/shipments";
import { createDemoOperations, injectBreakdown } from "@/lib/domain/recovery";
import {
  baselineReportModel,
  shipmentReportEnvelope,
} from "@/lib/domain/shipment-report";
import { executeApprovedRecovery } from "@/lib/operations/recovery-service";
import { generatePlans, registerHarvest } from "@/lib/planning/harvest-service";
import { createDemoIntake } from "@/lib/planning/intake-form";

describe("harvest through report", () => {
  let server: PGLiteSocketServer;
  let db: PrismaClient;
  let dataDir: string;
  const previousDataDir = process.env.KHETSE_DATA_DIR;

  beforeAll(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "khetse-demo-"));
    process.env.KHETSE_DATA_DIR = dataDir;
    const pglite = await PGlite.create();
    server = new PGLiteSocketServer({
      db: pglite,
      port: 55436,
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
    const departureWindow = new Date("2026-10-25T14:00:00.000Z");
    await db.transportSlot.createMany({
      data: [
        {
          id: "standard-10t",
          vehicleType: "Standard 10-T truck",
          capacityKg: 10_000,
          availableKg: 10_000,
          costPerKmInr: 32,
          departureWindow,
        },
        {
          id: "ventilated-10t",
          vehicleType: "Ventilated truck",
          capacityKg: 10_000,
          availableKg: 10_000,
          costPerKmInr: 38,
          departureWindow,
        },
      ],
    });
    await db.storageFacility.create({
      data: {
        id: "nashik-demo-cold",
        name: "nashik-demo-cold",
        location: "nashik-cold",
        totalSlots: 20,
        freeSlots: 12,
        kgPerSlot: 1_000,
        tempMinC: 5,
        tempMaxC: 5,
        dailyRateInr: 360,
      },
    });
  }, 60_000);

  afterAll(async () => {
    process.env.KHETSE_DATA_DIR = previousDataDir;
    await db?.$disconnect();
    await disconnectPrisma();
    await server?.stop();
    if (dataDir) await rm(dataDir, { recursive: true, force: true });
  });

  it("carries one lot from intake through a confirmed recovery into the report", async () => {
    const registered = registerHarvest(createDemoIntake(new Date()));
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;
    const plans = generatePlans({ harvestId: registered.body.harvestId });
    expect(plans.ok).toBe(true);
    if (!plans.ok) return;
    const plan = plans.body.feasiblePlans.find(
      (item) => item.planId === "plan_pune_standard_10t"
    );
    expect(plan?.planId).toBe("plan_pune_standard_10t");

    const reservation = await bookCapacity(
      {
        planId: plan?.planId ?? "",
        allocatedKg: 10_000,
        lockDurationMinutes: 30,
        transportSlotId: "standard-10t",
        idempotencyKey: "demo-flow-hold",
      },
      db
    );
    expect(reservation.status).toBe("CONFIRMED");

    const dispatchedAt = new Date(Date.now() + 60_000);
    const shipment = await createShipment(
      { reservationId: reservation.reservationId, dispatchedAt },
      db
    );
    expect(shipment.status).toBe("DISPATCHED");
    const inTransit = await transitionShipment(
      shipment.shipmentId,
      {
        status: "IN_TRANSIT",
        occurredAt: new Date(dispatchedAt.getTime() + 60_000),
        location: "Nashik, Maharashtra",
      },
      db
    );
    expect(inTransit.status).toBe("IN_TRANSIT");

    const disrupted = await recordShipmentDisruption(
      shipment.shipmentId,
      new Date(dispatchedAt.getTime() + 120_000),
      db
    );
    expect(disrupted.status).toBe("DISRUPTED");
    expect((await getShipment(shipment.shipmentId, db)).status).toBe(
      "DISRUPTED"
    );

    const state = injectBreakdown(createDemoOperations());
    state.reservation = {
      ...state.reservation,
      postgresReservationId: reservation.reservationId,
    };
    const approved = await executeApprovedRecovery(
      state,
      {
        incidentId: state.incident?.id ?? "",
        action: "APPROVE_RECOVERY_PLAN",
        selectedRecoveryPlanId: "rec_nashik-demo-cold",
        approvedBy: "Harvest coordinator",
        confirmDecision: true,
        managerApprovedBy: "Market manager",
        decidedAt: new Date(dispatchedAt.getTime() + 180_000).toISOString(),
      },
      db
    );
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.body.shipment.status).toBe("REROUTED");

    const stored = await getShipment(shipment.shipmentId, db);
    const report = await shipmentReportEnvelope({
      shipmentId: stored.shipmentId,
      status: stored.status,
    });
    const modeled = await baselineReportModel();
    expect(stored.status).toBe("REROUTED");
    expect(report.status).toBe(stored.status);
    expect(report.financialModel).toEqual(modeled);
    expect(report.financialModel.recoveryBranch.netProceedsInr).not.toBe(
      report.financialModel.noActionBranch.netProceedsInr
    );
    const statusRow = getShipmentReportRows(report).find(
      (row) => row.item === "Persisted shipment status"
    );
    expect(statusRow).toEqual({
      section: "Report",
      item: "Persisted shipment status",
      value: "REROUTED",
    });

    const replay = await replayDemoScenario("alternative-recovery", db);
    expect(replay.status).toBe("SIMULATED");
    expect(replay.scenarioId).toBe("alternative-recovery");
    expect(replay.modeledOutcome?.netProceedsInr).toBe(
      modeled.recoveryBranch.netProceedsInr
    );
    expect(await db.shipment.count()).toBe(0);
    expect(await db.reservation.count()).toBe(0);
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
    ).toBe(10_000);
    expect(
      (
        await db.storageFacility.findUniqueOrThrow({
          where: { id: "nashik-demo-cold" },
        })
      ).freeSlots
    ).toBe(12);
  });
});
