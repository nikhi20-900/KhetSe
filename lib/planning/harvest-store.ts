import fs from "fs";
import path from "path";

import {
  harvestIntakeFieldsSchema,
  type HarvestIntake,
  type RegisteredHarvest,
} from "@/lib/contracts/harvest.contract";

function storeFile(): string {
  const directory =
    process.env.KHETSE_DATA_DIR ?? path.join(process.cwd(), "data");
  return path.join(directory, "harvests.json");
}

function readAll(): RegisteredHarvest[] {
  const file = storeFile();
  if (!fs.existsSync(file)) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }
      const record = entry as Partial<RegisteredHarvest>;
      const intake = harvestIntakeFieldsSchema.safeParse({
        cropType: record.cropType,
        quantityKg: record.quantityKg,
        originLocation: record.originLocation,
        harvestTimestamp: record.harvestTimestamp,
        declaredQualityGrade: record.declaredQualityGrade,
        temperatureRequirementC: record.temperatureRequirementC,
        maxShelfLifeHours: record.maxShelfLifeHours,
      });
      if (
        !intake.success ||
        typeof record.harvestId !== "string" ||
        typeof record.createdAt !== "string"
      ) {
        return [];
      }
      return [
        {
          ...intake.data,
          harvestId: record.harvestId,
          status: "REGISTERED" as const,
          createdAt: record.createdAt,
        },
      ];
    });
  } catch {
    return [];
  }
}

function writeAll(records: RegisteredHarvest[]): void {
  const file = storeFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
}

function nextHarvestId(existing: Set<string>): string {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = `harv_${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;
    if (!existing.has(id)) {
      return id;
    }
  }
  return `harv_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function saveHarvest(intake: HarvestIntake): RegisteredHarvest {
  const records = readAll();
  const record: RegisteredHarvest = {
    ...intake,
    harvestId: nextHarvestId(new Set(records.map((item) => item.harvestId))),
    status: "REGISTERED",
    createdAt: new Date().toISOString(),
  };
  records.push(record);
  writeAll(records);
  return record;
}

export function getHarvest(harvestId: string): RegisteredHarvest | null {
  return readAll().find((record) => record.harvestId === harvestId) ?? null;
}

export function listHarvests(): RegisteredHarvest[] {
  return readAll().sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );
}
