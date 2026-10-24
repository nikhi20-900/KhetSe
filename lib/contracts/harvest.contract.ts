import { z } from "zod";

export const QUALITY_GRADES = ["Grade A", "Grade B", "Grade C"] as const;

export type QualityGrade = (typeof QUALITY_GRADES)[number];

const temperatureRequirementSchema = z
  .object({
    min: z
      .number({ invalid_type_error: "Enter a minimum temperature in °C." })
      .finite("Minimum temperature must be a finite number.")
      .gte(-5, "Minimum temperature must be at least -5°C.")
      .lte(50, "Minimum temperature must be at most 50°C."),
    max: z
      .number({ invalid_type_error: "Enter a maximum temperature in °C." })
      .finite("Maximum temperature must be a finite number.")
      .gte(-5, "Maximum temperature must be at least -5°C.")
      .lte(50, "Maximum temperature must be at most 50°C."),
  })
  .superRefine((value, ctx) => {
    if (value.min >= value.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max"],
        message: "Minimum temperature must be lower than the maximum.",
      });
    }
  });

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Field rules without the relative clock window, so stored batches can be reloaded later. */
export const harvestIntakeFieldsSchema = z.object({
  cropType: z
    .string({ required_error: "Crop type is required." })
    .trim()
    .min(1, "Crop type is required.")
    .max(80, "Crop type must be 80 characters or fewer."),
  quantityKg: z
    .number({
      invalid_type_error: "Harvest volume must be a number of kilograms.",
    })
    .finite("Harvest volume must be a finite number of kilograms.")
    .positive("Harvest volume must be greater than 0 kg.")
    .max(100_000, "Harvest volume cannot exceed 100,000 kg."),
  originLocation: z.object({
    name: z
      .string({ required_error: "Origin location is required." })
      .trim()
      .min(3, "Origin location is required.")
      .max(160, "Origin location must be 160 characters or fewer."),
    latitude: z
      .number({ invalid_type_error: "Latitude is required." })
      .finite("Latitude must be a finite number.")
      .gte(-90, "Latitude must be between -90 and 90.")
      .lte(90, "Latitude must be between -90 and 90."),
    longitude: z
      .number({ invalid_type_error: "Longitude is required." })
      .finite("Longitude must be a finite number.")
      .gte(-180, "Longitude must be between -180 and 180.")
      .lte(180, "Longitude must be between -180 and 180."),
  }),
  harvestTimestamp: z
    .string({ required_error: "Harvest completion time is required." })
    .datetime({
      offset: true,
      message: "Harvest completion time must be a valid timestamp.",
    }),
  declaredQualityGrade: z.enum(QUALITY_GRADES, {
    errorMap: () => ({ message: "Choose Grade A, Grade B, or Grade C." }),
  }),
  temperatureRequirementC: temperatureRequirementSchema,
  maxShelfLifeHours: z
    .number({ invalid_type_error: "Shelf-life horizon is required." })
    .finite("Shelf-life horizon must be a finite number of hours.")
    .positive("Shelf-life horizon must be greater than 0 hours.")
    .max(2_880, "Shelf-life horizon cannot exceed 2,880 hours (120 days)."),
});

/**
 * Harvest intake schema.
 * `now` is injectable so tests can freeze the logical date window.
 */
export function buildHarvestIntakeSchema(now = new Date()) {
  const earliest = new Date(now.getTime() - SEVEN_DAYS_MS);
  const latest = new Date(now.getTime() + THIRTY_DAYS_MS);

  return harvestIntakeFieldsSchema.superRefine((value, ctx) => {
    const harvestTime = new Date(value.harvestTimestamp);
    if (Number.isNaN(harvestTime.getTime())) {
      return;
    }
    if (harvestTime < earliest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["harvestTimestamp"],
        message:
          "Harvest completion time cannot be more than 7 days in the past.",
      });
    }
    if (harvestTime > latest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["harvestTimestamp"],
        message:
          "Harvest completion time cannot be more than 30 days in the future.",
      });
    }
  });
}

export type HarvestIntake = z.infer<
  ReturnType<typeof buildHarvestIntakeSchema>
>;

export interface RegisteredHarvest extends HarvestIntake {
  harvestId: string;
  status: "REGISTERED";
  createdAt: string;
}

export interface HarvestCreated {
  harvestId: string;
  status: "REGISTERED";
  createdAt: string;
}
