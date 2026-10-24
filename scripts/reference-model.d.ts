export interface ScenarioResult {
  id: string;
  saleableKg: number;
  grossProceedsInr: number;
  totalCostsInr: number;
  netProceedsInr: number;
}

export function loadBaseline(): Promise<{
  scenarios: Array<{ id: string }>;
  vehicles: Array<{ id: string; rateInrPerKm: number }>;
}>;

export function byId<T extends { id: string }>(rows: T[], id: string): T;

export function evaluateScenario(
  data: Awaited<ReturnType<typeof loadBaseline>>,
  scenario: { id: string }
): ScenarioResult;
