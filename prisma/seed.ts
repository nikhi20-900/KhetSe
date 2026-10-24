import { readFileSync } from "fs";
import path from "path";

import { PrismaClient } from "@prisma/client";

import { SIMULATED_KG_PER_SLOT, dailySlotRateInr } from "../lib/domain/booking";

interface BaselineVehicle {
  id: string;
  name: string;
  capacityKg: number;
  availableCount: number;
  rateInrPerKm: number;
}

interface BaselineStorage {
  id: string;
  nodeId: string;
  capacityKg: number;
  availableCapacityKg: number;
  holdingInrPerKgHour: number;
  environmentId: string;
}

interface Baseline {
  vehicles: BaselineVehicle[];
  storageFacilities: BaselineStorage[];
  environments: Array<{ id: string; temperatureC: number }>;
}

async function main() {
  const baseline = JSON.parse(
    readFileSync(path.join(process.cwd(), "data/demo-baseline.json"), "utf8")
  ) as Baseline;
  const cold = baseline.environments.find((item) => item.id === "cold");
  const temperature = cold?.temperatureC ?? 5;
  const prisma = new PrismaClient();
  const departureWindow = new Date("2026-10-25T14:00:00.000Z");

  for (const vehicle of baseline.vehicles) {
    for (let index = 1; index <= vehicle.availableCount; index += 1) {
      const id =
        vehicle.availableCount === 1 ? vehicle.id : `${vehicle.id}-${index}`;
      await prisma.transportSlot.upsert({
        where: { id },
        create: {
          id,
          vehicleType: vehicle.name,
          capacityKg: vehicle.capacityKg,
          availableKg: vehicle.capacityKg,
          costPerKmInr: vehicle.rateInrPerKm,
          departureWindow,
        },
        update: {},
      });
    }
  }

  for (const facility of baseline.storageFacilities) {
    if (
      facility.capacityKg % SIMULATED_KG_PER_SLOT !== 0 ||
      facility.availableCapacityKg % SIMULATED_KG_PER_SLOT !== 0
    ) {
      throw new Error(
        `${facility.id} capacity is not a whole number of ${SIMULATED_KG_PER_SLOT} kg slots.`
      );
    }
    await prisma.storageFacility.upsert({
      where: { id: facility.id },
      create: {
        id: facility.id,
        name: facility.id,
        location: facility.nodeId,
        totalSlots: facility.capacityKg / SIMULATED_KG_PER_SLOT,
        freeSlots: facility.availableCapacityKg / SIMULATED_KG_PER_SLOT,
        kgPerSlot: SIMULATED_KG_PER_SLOT,
        tempMinC: temperature,
        tempMaxC: temperature,
        dailyRateInr: dailySlotRateInr(facility.holdingInrPerKgHour),
      },
      update: {},
    });
  }

  await prisma.$disconnect();
  console.log(
    "Seeded simulated transport slots and storage facilities from data/demo-baseline.json."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
