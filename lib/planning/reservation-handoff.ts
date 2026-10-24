import { z } from "zod";

/** Booking handoff collected before the capacity-reservation service exists. */
export function buildReservationHandoffSchema(maxKg: number) {
  return z
    .object({
      planId: z.string().trim().min(1, "A plan id is required."),
      allocatedKg: z
        .number({
          invalid_type_error: "Allocated weight must be a number of kilograms.",
        })
        .finite("Allocated weight must be a finite number of kilograms.")
        .positive("Allocated weight must be greater than 0 kg."),
      lockDurationMinutes: z
        .number({ invalid_type_error: "Lock duration is required." })
        .int("Lock duration must be a whole number of minutes.")
        .min(5, "Lock duration must be at least 5 minutes.")
        .max(120, "Lock duration cannot exceed 120 minutes."),
    })
    .superRefine((value, ctx) => {
      if (value.allocatedKg > maxKg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allocatedKg"],
          message: `Allocated weight cannot exceed the harvest volume of ${maxKg} kg.`,
        });
      }
    });
}
