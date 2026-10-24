import { z } from "zod";

export const MODELED_ESTIMATE_LABEL = "Modeled estimate" as const;

export const REJECTION_CODES = {
  CAPACITY_MISMATCH: "CAPACITY_MISMATCH",
  THERMAL_INCOMPATIBILITY: "THERMAL_INCOMPATIBILITY",
  WINDOW_EXPIRED: "WINDOW_EXPIRED",
  SHELF_LIFE_EXPIRED: "SHELF_LIFE_EXPIRED",
  PRICE_BENCHMARK_UNAVAILABLE: "PRICE_BENCHMARK_UNAVAILABLE",
  ORIGIN_OUTSIDE_REGISTER: "ORIGIN_OUTSIDE_REGISTER",
  CROP_OUTSIDE_REGISTER: "CROP_OUTSIDE_REGISTER",
} as const;

export type RejectionCode =
  (typeof REJECTION_CODES)[keyof typeof REJECTION_CODES];

export const REJECTION_CATEGORIES: Record<RejectionCode, string> = {
  CAPACITY_MISMATCH: "Capacity Mismatch",
  THERMAL_INCOMPATIBILITY: "Thermal Incompatibility",
  WINDOW_EXPIRED: "Window Expired",
  SHELF_LIFE_EXPIRED: "Shelf-life Exceeded",
  PRICE_BENCHMARK_UNAVAILABLE: "Benchmark Unavailable",
  ORIGIN_OUTSIDE_REGISTER: "Origin Outside Register",
  CROP_OUTSIDE_REGISTER: "Crop Outside Register",
};

export const OBJECTIVE_LABELS = [
  "Fastest Transit",
  "Lowest Cost",
  "Maximum Estimated Proceeds",
] as const;

export type ObjectiveLabel = (typeof OBJECTIVE_LABELS)[number];

export interface ConstraintRejection {
  code: RejectionCode;
  category: string;
  message: string;
}

export interface PlanBreakdown {
  transportInr: number;
  handlingInr: number;
  storageInr: number;
  logisticsTotalInr: number;
  grossProceedsInr: number;
  netProceedsInr: number;
  dispatchBaseCostInr: number;
  perKmRateInr: number;
  distanceKm: number;
  quantityKg: number;
  uncooledHours: number;
  priceInrPerKg: number;
  freightClassification: "SIMULATED_DEMO_DATA";
  priceClassification: "EMPIRICAL_BENCHMARK";
  lossModel: "ambient_elapsed" | "ambient_wait_only";
  saleableFraction: number;
}

export interface FeasibleLogisticsPlan {
  planId: string;
  marketDestination: string;
  transportMode: string;
  transitDurationHours: number;
  transitDurationHoursMin: number;
  transitDurationHoursMax: number;
  receivingWindow: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  estimatedLogisticsCostInr: number;
  expectedGrossProceedsInr: number;
  expectedNetProceedsInr: number;
  estimateLabel: typeof MODELED_ESTIMATE_LABEL;
  objectiveLabels: ObjectiveLabel[];
  feasibility: {
    isFeasible: true;
    /** Modeled saleable fraction rounded to 4 decimals. Not a proprietary rank. */
    score: number;
    saleableFraction: number;
  };
  breakdown: PlanBreakdown;
}

export interface RejectedLogisticsPlan {
  planId: string;
  marketDestination: string;
  transportMode: string;
  feasibility: {
    isFeasible: false;
    rejectionReason: string;
  };
  rejections: ConstraintRejection[];
}

export interface LogisticsPlanEvaluation {
  estimateLabel: typeof MODELED_ESTIMATE_LABEL;
  evaluatedCombinations: number;
  feasiblePlans: FeasibleLogisticsPlan[];
  rejectedPlans: RejectedLogisticsPlan[];
  featuredPlanIds: string[];
  blockingReason: ConstraintRejection | null;
}

export const planRequestSchema = z.object({
  harvestId: z.string().trim().min(1, "A harvest id is required."),
});

export type PlanRequest = z.infer<typeof planRequestSchema>;
