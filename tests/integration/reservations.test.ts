import { spawn } from "child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";

import { disconnectPrisma } from "@/lib/db/client";
import {
  ReservationError,
  availableTransportKg,
  bookCapacity,
  cancelReservation,
  getReservation,
  swapReservation,
} from "@/lib/db/queries/reservations";

const databaseName = "postgres";

describe("transactional capacity reservations", () => {
  let server: PGLiteSocketServer;
  let db: PrismaClient;
  const truckId = "test-truck";
  const coldId = "test-cold";

  beforeAll(async () => {
    const pglite = await PGlite.create();
    server = new PGLiteSocketServer({
      db: pglite,
      port: 55432,
      host: "127.0.0.1",
      maxConnections: 12,
    });
    await server.start();
    process.env.DATABASE_URL = `postgresql://postgres:postgres@${server.getServerConn()}/${databaseName}?sslmode=disable&connection_limit=8`;
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
      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr));
      });
    });
    db = new PrismaClient();
    await db.transportSlot.create({
      data: {
        id: truckId,
        vehicleType: "Test truck",
        capacityKg: 10_000,
        availableKg: 10_000,
        costPerKmInr: 38,
        departureWindow: new Date("2026-10-25T14:00:00.000Z"),
      },
    });
    await db.storageFacility.create({
      data: {
        id: coldId,
        name: "Test cold room",
        location: "test",
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

  it("rejects concurrent bookings that would exceed the locked kilograms", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        bookCapacity(
          {
            planId: `plan_concurrent_${index}`,
            allocatedKg: 3_000,
            lockDurationMinutes: 15,
            transportSlotId: truckId,
            idempotencyKey: `concurrent-${index}`,
          },
          db
        ).then(
          (response) => ({ ok: true as const, response }),
          (error: unknown) => ({ ok: false as const, error })
        )
      )
    );
    const confirmed = results.filter((result) => result.ok);
    const rejected = results.filter((result) => !result.ok);
    expect(confirmed).toHaveLength(3);
    expect(rejected).toHaveLength(5);
    for (const result of rejected) {
      if (result.ok) continue;
      expect(result.error).toBeInstanceOf(ReservationError);
      expect((result.error as ReservationError).status).toBe(409);
    }
    expect(await availableTransportKg(truckId, db)).toBe(1_000);
  });

  it("returns the same reservation when the idempotency key is repeated", async () => {
    const first = await bookCapacity(
      {
        planId: "plan_idempotent",
        allocatedKg: 1_000,
        lockDurationMinutes: 15,
        transportSlotId: truckId,
        idempotencyKey: "same-key",
      },
      db
    );
    const second = await bookCapacity(
      {
        planId: "plan_idempotent",
        allocatedKg: 1_000,
        lockDurationMinutes: 15,
        transportSlotId: truckId,
        idempotencyKey: "same-key",
      },
      db
    );
    expect(second.reservationId).toBe(first.reservationId);
    expect(await availableTransportKg(truckId, db)).toBe(0);
  });

  it("returns capacity when a hold is cancelled or expires", async () => {
    const fresh = await db.transportSlot.create({
      data: {
        id: "expire-truck",
        vehicleType: "Expiry truck",
        capacityKg: 5_000,
        availableKg: 5_000,
        costPerKmInr: 32,
        departureWindow: new Date("2026-10-25T14:00:00.000Z"),
      },
    });
    const held = await bookCapacity(
      {
        planId: "plan_cancel",
        allocatedKg: 2_000,
        lockDurationMinutes: 15,
        transportSlotId: fresh.id,
      },
      db
    );
    await cancelReservation(held.reservationId, db);
    expect(await availableTransportKg(fresh.id, db)).toBe(5_000);

    const expiredHold = await bookCapacity(
      {
        planId: "plan_expired",
        allocatedKg: 5_000,
        lockDurationMinutes: 5,
        transportSlotId: fresh.id,
        idempotencyKey: "expired-hold",
      },
      db
    );
    await db.$executeRaw`
      UPDATE reservations
      SET "expiresAt" = NOW() - INTERVAL '1 minute'
      WHERE id = ${expiredHold.reservationId}
    `;
    const replacement = await bookCapacity(
      {
        planId: "plan_after_expiry",
        allocatedKg: 5_000,
        lockDurationMinutes: 15,
        transportSlotId: fresh.id,
        idempotencyKey: "after-expiry",
      },
      db
    );
    expect(replacement.status).toBe("CONFIRMED");
    expect(await availableTransportKg(fresh.id, db)).toBe(0);
  });

  it("rolls back a booking that cannot claim every requested resource", async () => {
    const slot = await db.transportSlot.create({
      data: {
        id: "partial-truck",
        vehicleType: "Partial truck",
        capacityKg: 10_000,
        availableKg: 10_000,
        costPerKmInr: 32,
        departureWindow: new Date("2026-10-25T14:00:00.000Z"),
      },
    });
    await expect(
      bookCapacity(
        {
          planId: "plan_partial",
          allocatedKg: 3_000,
          lockDurationMinutes: 15,
          transportSlotId: slot.id,
          storageFacilityId: coldId,
          idempotencyKey: "partial-booking",
        },
        db
      )
    ).rejects.toMatchObject({ status: 409, code: "CAPACITY_EXCEEDED" });
    expect(await availableTransportKg(slot.id, db)).toBe(10_000);
    expect(
      await db.reservation.count({
        where: { requestedPlanKey: "plan_partial" },
      })
    ).toBe(0);
    expect(
      (await db.storageFacility.findUniqueOrThrow({ where: { id: coldId } }))
        .freeSlots
    ).toBe(2);
  });

  it("keeps the original reservation when the recovery swap cannot claim the new facility", async () => {
    const slot = await db.transportSlot.create({
      data: {
        id: "swap-truck",
        vehicleType: "Swap truck",
        capacityKg: 8_000,
        availableKg: 8_000,
        costPerKmInr: 38,
        departureWindow: new Date("2026-10-25T14:00:00.000Z"),
      },
    });
    const booked = await bookCapacity(
      {
        planId: "plan_swap",
        allocatedKg: 8_000,
        lockDurationMinutes: 30,
        transportSlotId: slot.id,
        idempotencyKey: "swap-original",
      },
      db
    );
    await expect(
      swapReservation(
        {
          reservationId: booked.reservationId,
          storageFacilityId: coldId,
          idempotencyKey: "swap-fail",
        },
        db
      )
    ).rejects.toMatchObject({ status: 409, code: "CAPACITY_EXCEEDED" });

    const original = await getReservation(booked.reservationId, db);
    expect(original.status).toBe("CONFIRMED");
    expect(original.transportSlotId).toBe(slot.id);
    expect(original.storageFacilityId).toBeNull();
    expect(await availableTransportKg(slot.id, db)).toBe(0);
    expect(
      (await db.storageFacility.findUniqueOrThrow({ where: { id: coldId } }))
        .freeSlots
    ).toBe(2);
    expect(
      await db.reservation.count({ where: { requestedPlanKey: "plan_swap" } })
    ).toBe(1);
  });
});
