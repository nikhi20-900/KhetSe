import { z } from "zod";

export const reservationRequestSchema = z
  .object({
    planId: z.string().trim().min(1, "A plan id is required."),
    allocatedKg: z
      .number({
        invalid_type_error: "Allocated weight must be a number of kilograms.",
      })
      .finite("Allocated weight must be a finite number of kilograms.")
      .positive("Allocated weight must be greater than 0 kg.")
      .max(100_000, "Allocated weight cannot exceed 100,000 kg."),
    lockDurationMinutes: z
      .number({ invalid_type_error: "Lock duration is required." })
      .int("Lock duration must be a whole number of minutes.")
      .min(5, "Lock duration must be at least 5 minutes.")
      .max(120, "Lock duration cannot exceed 120 minutes."),
    transportSlotId: z.string().trim().min(1).optional(),
    storageFacilityId: z.string().trim().min(1).optional(),
  })
  .strict();

export type ReservationRequest = z.infer<typeof reservationRequestSchema>;

export const reservationSwapSchema = z
  .object({
    transportSlotId: z.string().trim().min(1).nullable().optional(),
    storageFacilityId: z.string().trim().min(1).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.transportSlotId && !value.storageFacilityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name the transport slot or storage facility to claim.",
      });
    }
  });

export type ReservationSwapRequest = z.infer<typeof reservationSwapSchema>;

export interface ReservationResponse {
  reservationId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "CONSUMED";
  allocatedKg: number;
  allocatedSlots: number | null;
  expiresAt: string;
  transportSlotId: string | null;
  storageFacilityId: string | null;
  requestedPlanKey: string;
  message: string;
}
