import { z } from "zod";

import { NORMAL_SHIPMENT_STATUSES } from "@/lib/domain/state-machine";

export const createShipmentSchema = z
  .object({
    reservationId: z.string().trim().min(1, "A reservation id is required."),
    dispatchedAt: z
      .string()
      .datetime({
        offset: true,
        message: "Dispatch time must be a valid timestamp.",
      })
      .optional(),
  })
  .strict();

export type CreateShipmentRequest = z.infer<typeof createShipmentSchema>;

export const shipmentTransitionSchema = z
  .object({
    status: z.enum(NORMAL_SHIPMENT_STATUSES),
    occurredAt: z.string().datetime({
      offset: true,
      message: "Event time must be a valid timestamp.",
    }),
    location: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status !== "DISPATCHED" && !value.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "A location is required for this shipment event.",
      });
    }
  });

export type ShipmentTransitionRequest = z.infer<
  typeof shipmentTransitionSchema
>;

export interface ShipmentEventResponse {
  id: string;
  eventType: string;
  location: string | null;
  description: string;
  eventTime: string;
}

export interface ShipmentResponse {
  shipmentId: string;
  status: string;
  currentLocation: string | null;
  milestoneEventsCount: number;
  reservationId: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  events: ShipmentEventResponse[];
}
