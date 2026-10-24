import {
  buildHarvestIntakeSchema,
  QUALITY_GRADES,
  type HarvestIntake,
  type QualityGrade,
} from "@/lib/contracts/harvest.contract";
import {
  AMBIENT_HANDLING_BAND_C,
  DEMO_CROP_TYPE,
  DEMO_ORIGIN,
} from "@/lib/planning/catalog";
import {
  addCivilDays,
  civilDateInTimeZone,
  defaultHarvestLocalInput,
} from "@/lib/planning/schedule";

export type HarvestFormValues = {
  cropType: string;
  quantityKg: string;
  originName: string;
  latitude: string;
  longitude: string;
  harvestCompletedAt: string;
  declaredQualityGrade: string;
  temperatureMinC: string;
  temperatureMaxC: string;
  maxShelfLifeHours: string;
};

export type FieldErrors = Partial<Record<keyof HarvestFormValues, string>>;

const FIELD_BY_PATH: Record<string, keyof HarvestFormValues> = {
  cropType: "cropType",
  quantityKg: "quantityKg",
  "originLocation.name": "originName",
  "originLocation.latitude": "latitude",
  "originLocation.longitude": "longitude",
  harvestTimestamp: "harvestCompletedAt",
  declaredQualityGrade: "declaredQualityGrade",
  "temperatureRequirementC.min": "temperatureMinC",
  "temperatureRequirementC.max": "temperatureMaxC",
  maxShelfLifeHours: "maxShelfLifeHours",
};

export function createDemoFormValues(now = new Date()): HarvestFormValues {
  return {
    cropType: DEMO_CROP_TYPE,
    quantityKg: "10000",
    originName: DEMO_ORIGIN.name,
    latitude: String(DEMO_ORIGIN.latitude),
    longitude: String(DEMO_ORIGIN.longitude),
    harvestCompletedAt: defaultHarvestLocalInput(now),
    declaredQualityGrade: "Grade A",
    temperatureMinC: String(AMBIENT_HANDLING_BAND_C.min),
    temperatureMaxC: String(AMBIENT_HANDLING_BAND_C.max),
    maxShelfLifeHours: "96",
  };
}

export function createDemoIntake(now = new Date()): HarvestIntake {
  const tomorrow = addCivilDays(civilDateInTimeZone(now), 1);
  const month = String(tomorrow.month).padStart(2, "0");
  const day = String(tomorrow.day).padStart(2, "0");
  return buildHarvestIntakeSchema(now).parse({
    cropType: DEMO_CROP_TYPE,
    quantityKg: 10_000,
    originLocation: {
      name: DEMO_ORIGIN.name,
      latitude: DEMO_ORIGIN.latitude,
      longitude: DEMO_ORIGIN.longitude,
    },
    harvestTimestamp: `${tomorrow.year}-${month}-${day}T06:00:00+05:30`,
    declaredQualityGrade: "Grade A",
    temperatureRequirementC: {
      min: AMBIENT_HANDLING_BAND_C.min,
      max: AMBIENT_HANDLING_BAND_C.max,
    },
    maxShelfLifeHours: 96,
  });
}

export function intakeToFormValues(intake: HarvestIntake): HarvestFormValues {
  return {
    cropType: intake.cropType,
    quantityKg: String(intake.quantityKg),
    originName: intake.originLocation.name,
    latitude: String(intake.originLocation.latitude),
    longitude: String(intake.originLocation.longitude),
    harvestCompletedAt: toDateTimeLocalValue(new Date(intake.harvestTimestamp)),
    declaredQualityGrade: intake.declaredQualityGrade,
    temperatureMinC: String(intake.temperatureRequirementC.min),
    temperatureMaxC: String(intake.temperatureRequirementC.max),
    maxShelfLifeHours: String(intake.maxShelfLifeHours),
  };
}

export function isQualityGrade(value: string): value is QualityGrade {
  return QUALITY_GRADES.some((grade) => grade === value);
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toTimestamp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString();
}

function numeric(value: string): number | string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
}

export function toHarvestIntake(
  values: HarvestFormValues,
  now = new Date()
): { ok: true; intake: HarvestIntake } | { ok: false; errors: FieldErrors } {
  const parsed = buildHarvestIntakeSchema(now).safeParse({
    cropType: values.cropType,
    quantityKg: numeric(values.quantityKg),
    originLocation: {
      name: values.originName,
      latitude: numeric(values.latitude),
      longitude: numeric(values.longitude),
    },
    harvestTimestamp: toTimestamp(values.harvestCompletedAt),
    declaredQualityGrade: values.declaredQualityGrade,
    temperatureRequirementC: {
      min: numeric(values.temperatureMinC),
      max: numeric(values.temperatureMaxC),
    },
    maxShelfLifeHours: numeric(values.maxShelfLifeHours),
  });

  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = FIELD_BY_PATH[issue.path.join(".")];
      if (!key || errors[key]) continue;
      errors[key] = issue.message;
    }
    if (Object.keys(errors).length === 0) {
      errors.cropType = "Harvest details did not match the intake contract.";
    }
    return { ok: false, errors };
  }

  return { ok: true, intake: parsed.data };
}
