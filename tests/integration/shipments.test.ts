import { spawn } from "child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";

import { disconnectPrisma } from "@/lib/db/client";
import { bookCapacity } from "@/lib/db/queries/reservations";
import {
  ShipmentError,
  createShipment,
  getShipment,
  transitionShipment,
} from "@/lib/db/queries/shipments";

describe("shipment normal delivery path", () => {
  let server: PGLiteSocketServer;
  let db: PrismaClient;
  const truckId = "delivery-truck";

  beforeAll(async () => {
    const pglite = await PGlite.create();
    server = new PGLiteSocketServer({
      db: pglite,
      port: 55433,
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
    await db.transportSlot.create({
      data: {
        id: truckId,
        vehicleType: "Ventilated truck",
        capacityKg: 10_000,
        availableKg: 10_000,
        costPerKmInr: 38,
        departureWindow: new Date("2026-10-25T14:00:00.000Z"),
      },
    });
  }, 60_000);

  afterAll(async () => {
    await db?.$disconnect();
    await disconnectPrisma();
    await server?.stop();
  });

  it("records the booked-to-delivered path in order and consumes the reservation", async () => {
    const reservation = await bookCapacity(
      {
        planId: "plan_vashi_ventilated_10t",
        allocatedKg: 10_000,
        lockDurationMinutes: 30,
        transportSlotId: truckId,
        idempotencyKey: "delivery-hold",
      },
      db
    );
    const dispatchedAt = new Date(Date.now() + 60_000);
    const inTransitAt = new Date(dispatchedAt.getTime() + 60_000);
    const deliveredAt = new Date(inTransitAt.getTime() + 60_000);
    const created = await createShipment(
      { reservationId: reservation.reservationId, dispatchedAt },
      db
    );
    expect(created.status).toBe("DISPATCHED");
    expect(created.currentLocation).toBe("Pimpalgaon Baswant, Maharashtra");
    expect(created.events.map((event) => event.eventType)).toEqual([
      "BOOKED",
      "DISPATCHED",
    ]);
    expect(created.milestoneEventsCount).toBe(2);
    expect(created.events[0].eventTime < created.events[1].eventTime).toBe(
      true
    );

    await expect(
      transitionShipment(
        created.shipmentId,
        {
          status: "IN_TRANSIT",
          occurredAt: new Date(
            new Date(created.events[0].eventTime).getTime() - 60_000
          ),
          location: "Earlier than booking",
        },
        db
      )
    ).rejects.toMatchObject({ status: 422, code: "EVENT_OUT_OF_ORDER" });

    const inTransit = await transitionShipment(
      created.shipmentId,
      {
        status: "IN_TRANSIT",
        occurredAt: inTransitAt,
        location: "Nashik transfer checkpoint (fictional)",
      },
      db
    );
    const delivered = await transitionShipment(
      created.shipmentId,
      {
        status: "DELIVERED",
        occurredAt: deliveredAt,
        location: "Vashi APMC Mumbai",
      },
      db
    );
    expect(inTransit.events.map((event) => event.eventType)).toEqual([
      "BOOKED",
      "DISPATCHED",
      "IN_TRANSIT",
    ]);
    expect(delivered.status).toBe("DELIVERED");
    expect(delivered.events.map((event) => event.eventType)).toEqual([
      "BOOKED",
      "DISPATCHED",
      "IN_TRANSIT",
      "DELIVERED",
    ]);
    const times = delivered.events.map((event) => event.eventTime);
    expect([...times].sort()).toEqual(times);

    const stored = await getShipment(created.shipmentId, db);
    expect(stored.events.map((event) => event.id)).toEqual(
      delivered.events.map((event) => event.id)
    );
    const held = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.reservationId },
    });
    expect(held.status).toBe("CONSUMED");

    await expect(
      transitionShipment(
        created.shipmentId,
        {
          status: "DISPATCHED",
          occurredAt: new Date(deliveredAt.getTime() + 60_000),
          location: "Pimpalgaon Baswant, Maharashtra",
        },
        db
      )
    ).rejects.toMatchObject({
      status: 422,
      code: "INVALID_SHIPMENT_TRANSITION",
    });

    await expect(
      createShipment({ reservationId: reservation.reservationId }, db)
    ).rejects.toBeInstanceOf(ShipmentError);
    expect(
      await db.shipment.count({
        where: { reservationId: reservation.reservationId },
      })
    ).toBe(1);
    const eventId = delivered.events[0].id;
    await expect(
      db.shipmentEvent.update({
        where: { id: eventId },
        data: { description: "rewritten" },
      })
    ).rejects.toThrow(/SHIPMENT_EVENT_IMMUTABLE/);
    const unchanged = await db.shipmentEvent.findUniqueOrThrow({
      where: { id: eventId },
    });
    expect(unchanged.description).toContain("confirmed capacity reservation");
  });

  it("rejects a shipment for a reservation that is not confirmed", async () => {
    const slot = await db.transportSlot.create({
      data: {
        id: "pending-truck",
        vehicleType: "Standard 10-T truck",
        capacityKg: 10_000,
        availableKg: 10_000,
        costPerKmInr: 32,
        departureWindow: new Date("2026-10-25T14:00:00.000Z"),
      },
    });
    const reservation = await bookCapacity(
      {
        planId: "plan_not_ready",
        allocatedKg: 1_000,
        lockDurationMinutes: 15,
        transportSlotId: slot.id,
      },
      db
    );
    await db.reservation.update({
      where: { id: reservation.reservationId },
      data: { status: "PENDING" },
    });
    await expect(
      createShipment({ reservationId: reservation.reservationId }, db)
    ).rejects.toMatchObject({ status: 422, code: "RESERVATION_NOT_CONFIRMED" });
    expect(
      await db.shipment.count({
        where: { reservationId: reservation.reservationId },
      })
    ).toBe(0);

    const confirmed = await bookCapacity(
      {
        planId: "plan_skip",
        allocatedKg: 1_000,
        lockDurationMinutes: 15,
        transportSlotId: slot.id,
      },
      db
    );
    const booked = await createShipment(
      { reservationId: confirmed.reservationId },
      db
    );
    expect(booked.status).toBe("BOOKED");
    expect(booked.events.map((event) => event.eventType)).toEqual(["BOOKED"]);
    await expect(
      transitionShipment(
        booked.shipmentId,
        {
          status: "DELIVERED",
          occurredAt: new Date(Date.now() + 1_000),
          location: "Vashi APMC Mumbai",
        },
        db
      )
    ).rejects.toMatchObject({
      status: 422,
      code: "INVALID_SHIPMENT_TRANSITION",
    });
    expect((await getShipment(booked.shipmentId, db)).status).toBe("BOOKED");
  });
});
