import fs from "fs";
import path from "path";

import type { PrismaClient } from "@prisma/client";

import baseline from "@/data/demo-baseline.json";
import type { ScenarioCommandResult } from "@/lib/contracts/scenario.contract";
import { getPrisma } from "@/lib/db/client";
import { withReservationTransaction } from "@/lib/db/transactions";
import { SIMULATED_KG_PER_SLOT, dailySlotRateInr } from "@/lib/domain/booking";
import { resetOperations } from "@/lib/operations/operations-store";
import {
  byId,
  evaluateScenario,
  loadBaseline,
} from "@/scripts/reference-model.mjs";

const departureWindow = new Date("2026-10-25T14:00:00.000Z");

function slotId(
  vehicleId: string,
  availableCount: number,
  index: number
): string {
  return availableCount === 1 ? vehicleId : `${vehicleId}-${index}`;
}

function clearDemoFiles(): void {
  resetOperations();
  const harvests = path.join(
    process.env.KHETSE_DATA_DIR ?? path.join(process.cwd(), "data"),
    "harvests.json"
  );
  if (fs.existsSync(harvests)) fs.unlinkSync(harvests);
}

async function restoreBaselineCapacity(db: PrismaClient): Promise<void> {
  const cold = baseline.environments.find((item) => item.id === "cold");
  const temperature = cold?.temperatureC ?? 5;
  await withReservationTransaction(async (tx) => {
    // Demo reset is the explicit exception to the append-only event trigger.
    await tx.$executeRawUnsafe(
      "ALTER TABLE shipment_events DISABLE TRIGGER ALL"
    );
    await tx.shipment.deleteMany();
    await tx.$executeRawUnsafe(
      "ALTER TABLE shipment_events ENABLE TRIGGER ALL"
    );
    await tx.reservation.deleteMany();
    await tx.idempotencyRecord.deleteMany();
    for (const vehicle of baseline.vehicles) {
      for (let index = 1; index <= vehicle.availableCount; index += 1) {
        const id = slotId(vehicle.id, vehicle.availableCount, index);
        await tx.transportSlot.upsert({
          where: { id },
          create: {
            id,
            vehicleType: vehicle.name,
            capacityKg: vehicle.capacityKg,
            availableKg: vehicle.capacityKg,
            costPerKmInr: vehicle.rateInrPerKm,
            departureWindow,
          },
          update: {
            availableKg: vehicle.capacityKg,
            capacityKg: vehicle.capacityKg,
            costPerKmInr: vehicle.rateInrPerKm,
          },
        });
      }
    }
    for (const facility of baseline.storageFacilities) {
      const totalSlots = facility.capacityKg / SIMULATED_KG_PER_SLOT;
      const freeSlots = facility.availableCapacityKg / SIMULATED_KG_PER_SLOT;
      await tx.storageFacility.upsert({
        where: { id: facility.id },
        create: {
          id: facility.id,
          name: facility.id,
          location: facility.nodeId,
          totalSlots,
          freeSlots,
          kgPerSlot: SIMULATED_KG_PER_SLOT,
          tempMinC: temperature,
          tempMaxC: temperature,
          dailyRateInr: dailySlotRateInr(facility.holdingInrPerKgHour),
        },
        update: { totalSlots, freeSlots },
      });
    }
  }, db);
}

export async function resetDemoScenario(
  db: PrismaClient = getPrisma()
): Promise<ScenarioCommandResult> {
  await restoreBaselineCapacity(db);
  clearDemoFiles();
  return {
    action: "reset",
    restored: true,
    status: "SIMULATED",
    scenarioId: null,
    modeledOutcome: null,
  };
}

export async function replayDemoScenario(
  scenarioId: string,
  db: PrismaClient = getPrisma()
): Promise<ScenarioCommandResult> {
  await restoreBaselineCapacity(db);
  clearDemoFiles();
  const data = await loadBaseline();
  const outcome = evaluateScenario(data, byId(data.scenarios, scenarioId));
  return {
    action: "replay",
    restored: true,
    status: "SIMULATED",
    scenarioId,
    modeledOutcome: {
      saleableKg: outcome.saleableKg,
      grossProceedsInr: outcome.grossProceedsInr,
      logisticsCostInr: outcome.totalCostsInr,
      netProceedsInr: outcome.netProceedsInr,
    },
  };
}
