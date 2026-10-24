import { z } from "zod";

export const DEMO_SHIPMENT_ID = "demo-igatpuri";
export const DEMO_INCIDENT_ID = "inc_demo_igatpuri";

export const RECOVERY_ACTIONS = [
  "APPROVE_RECOVERY_PLAN",
  "SELECT_NO_ACTION",
] as const;

export type RecoveryAction = (typeof RECOVERY_ACTIONS)[number];

export const recoveryDecisionSchema = z.object({
  incidentId: z.string().trim().min(1, "An incident id is required."),
  action: z.enum(RECOVERY_ACTIONS, {
    errorMap: () => ({
      message: "Choose a recovery plan or no action.",
    }),
  }),
  selectedRecoveryPlanId: z
    .string()
    .trim()
    .min(1, "Select a recovery option before approving."),
  approvedBy: z
    .string()
    .trim()
    .min(3, "Enter the name of the person approving this decision."),
  confirmDecision: z.literal(true, {
    errorMap: () => ({
      message: "Recovery requires explicit approval before any change.",
    }),
  }),
  managerApprovedBy: z.string().trim().optional(),
  approvalNotes: z
    .string()
    .trim()
    .max(500, "Approval notes must be 500 characters or fewer.")
    .optional(),
});

export type RecoveryDecisionInput = z.infer<typeof recoveryDecisionSchema>;

export const injectBreakdownSchema = z.object({
  action: z.literal("INJECT_BREAKDOWN"),
  shipmentId: z.string().trim().min(1),
});
