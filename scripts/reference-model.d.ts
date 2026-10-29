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

export interface ScenarioEvaluation {
  id: string;
  status: string;
  marketId: string;
  distanceKm: number;
  arrivalHours: number;
  waitingHours: number;
  completionHours: number;
  effectiveAgeHours: number;
  grade: string;
  qualityFraction: number;
  saleableKg: number;
  referenceShelfLifeRemainingHours: number;
  grossProceedsInr: number;
  totalCostsInr: number;
  netProceedsInr: number;
  interventionCostInr: number;
  costBreakdownInr: Record<string, number>;
  milestones: ScenarioMilestone[];
  comparisonScenarioId?: string;
  incrementalNetInr?: number;
  recommendation?: "BETTER_THAN_NO_ACTION" | "REJECT_INTERVENTION";
}

export interface BaselineScenario {
  id: string;
  marketId: string;
  description?: string;
  comparisonScenarioId?: string;
  decisionNodeId?: string;
  steps: Array<Record<string, unknown>>;
}

export interface BaselineData {
  crop: {
    originNodeId: string;
    quantityKg: number;
    bulkDensityKgPerM3: number;
    name: string;
    initialGrade: string;
    referenceShelfLifeHours: number;
    handling: string;
  };
  clock: {
    dispatchAt: string;
    timeZone: string;
    harvestWindowStart: string;
    harvestWindowEnd: string;
  };
  nodes: Array<{
    id: string;
    name: string;
    latitudeDeg: number;
    longitudeDeg: number;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    distanceKm: number;
    durationHours: number;
  }>;
  routes: Array<{ id: string; edgeIds: string[] }>;
  vehicles: Array<{
    id: string;
    name: string;
    capacityKg: number;
    capacityM3: number;
    availableCount: number;
    fixedDispatchInr: number;
    environmentId: string;
    transferHours: number;
  }>;
  markets: Array<{
    id: string;
    nodeId: string;
    priceInrPerKg: number;
    unloadingSlotsLocalHours: number[][];
    unloadingHours: number;
  }>;
  storageFacilities: Array<{
    id: string;
    nodeId: string;
    holdingInrPerKgHour: number;
  }>;
  scenarios: BaselineScenario[];
}

export function loadBaseline(): Promise<BaselineData>;

export function byId<T extends { id: string }>(rows: T[], id: string): T;

export function evaluateScenario(
  data: BaselineData,
  scenario: BaselineScenario
): ScenarioEvaluation;

export function evaluateAll(data: BaselineData): ScenarioEvaluation[];

export function routeTotals(
  data: BaselineData,
  edgeIds: string[],
  startNodeId?: string
): { nodeId: string; distanceKm: number; durationHours: number };
