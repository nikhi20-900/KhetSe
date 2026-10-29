export interface ScenarioMilestone {
  kind: string;
  elapsedHours: number;
  durationHours?: number;
  edgeId?: string;
  nodeId?: string;
  facilityId?: string;
  environmentId?: string;
  vehicleId?: string;
  costInr?: number;
}

export interface ScenarioCostBreakdown {
  dispatch: number;
  transport: number;
  loading: number;
  intervention: number;
  storage: number;
  detention: number;
  unloading: number;
  marketFees: number;
}

export interface ScenarioResult {
  id: string;
  status: string;
  marketId: string;
  saleableKg: number;
  qualityFraction: number;
  grade: string;
  grossProceedsInr: number;
  totalCostsInr: number;
  netProceedsInr: number;
  interventionCostInr: number;
  costBreakdownInr: ScenarioCostBreakdown;
  distanceKm?: number;
  arrivalHours?: number;
  waitingHours?: number;
  completionHours?: number;
  effectiveAgeHours?: number;
  referenceShelfLifeRemainingHours?: number;
  milestones?: ScenarioMilestone[];
  comparisonScenarioId?: string;
  incrementalNetInr?: number;
  recommendation?: "BETTER_THAN_NO_ACTION" | "REJECT_INTERVENTION";
}

export function loadBaseline(): Promise<{
  scenarios: Array<{ id: string; steps: unknown[] }>;
  vehicles: Array<{ id: string; rateInrPerKm: number }>;
}>;

export function loadEvidence(): Promise<unknown>;

export function byId<T extends { id: string }>(rows: T[], id: string): T;

export function evaluateScenario(
  data: Awaited<ReturnType<typeof loadBaseline>>,
  scenario: { id: string; steps?: unknown[] }
): ScenarioResult;

export function prefixCostInr(
  data: Awaited<ReturnType<typeof loadBaseline>>,
  scenario: { id: string; steps: unknown[] },
  stepCount: number
): number;

export function evaluateAll(
  data: Awaited<ReturnType<typeof loadBaseline>> & {
    scenarios: Array<{ id: string; comparisonScenarioId?: string }>;
  }
): ScenarioResult[];
