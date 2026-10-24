import {
  buildHarvestIntakeSchema,
  type HarvestCreated,
  type RegisteredHarvest,
} from "@/lib/contracts/harvest.contract";
import {
  planRequestSchema,
  type LogisticsPlanEvaluation,
} from "@/lib/contracts/plan.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import { evaluateLogisticsPlans } from "@/lib/domain/feasibility";
import {
  getHarvest,
  listHarvests,
  saveHarvest,
} from "@/lib/planning/harvest-store";

export type ServiceResult<T> =
  | { ok: true; status: number; body: T }
  | { ok: false; status: number; body: ProblemDetails };

export interface PlanResponse extends LogisticsPlanEvaluation {
  harvestId: string;
}

function malformed(instance: string): ServiceResult<never> {
  return {
    ok: false,
    status: 400,
    body: {
      type: "https://khetse.org/errors/malformed-json",
      title: "Malformed JSON",
      status: 400,
      detail: "The request body is not valid JSON.",
      instance,
    },
  };
}

export type JsonRead =
  | { kind: "json"; value: unknown }
  | { kind: "invalid"; result: ServiceResult<never> };

export async function readJsonBody(
  request: Request,
  instance: string
): Promise<JsonRead> {
  try {
    return { kind: "json", value: await request.json() };
  } catch {
    return { kind: "invalid", result: malformed(instance) };
  }
}

export function registerHarvest(
  input: unknown,
  now = new Date()
): ServiceResult<HarvestCreated> {
  const parsed = buildHarvestIntakeSchema(now).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      body: validationProblem(parsed.error, "/api/harvests"),
    };
  }

  const saved = saveHarvest(parsed.data);
  return {
    ok: true,
    status: 201,
    body: {
      harvestId: saved.harvestId,
      status: saved.status,
      createdAt: saved.createdAt,
    },
  };
}

export function getRegisteredHarvest(
  harvestId: string
): ServiceResult<RegisteredHarvest> {
  const harvest = getHarvest(harvestId);
  if (!harvest) {
    return {
      ok: false,
      status: 404,
      body: {
        type: "https://khetse.org/errors/harvest-not-found",
        title: "Harvest not found",
        status: 404,
        detail: `No registered harvest matches ${harvestId}.`,
        instance: `/api/harvests/${harvestId}`,
      },
    };
  }
  return { ok: true, status: 200, body: harvest };
}

export function listRegisteredHarvests(): ServiceResult<{
  harvests: RegisteredHarvest[];
}> {
  return { ok: true, status: 200, body: { harvests: listHarvests() } };
}

export function generatePlans(input: unknown): ServiceResult<PlanResponse> {
  const parsed = planRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      body: validationProblem(parsed.error, "/api/plans"),
    };
  }

  const harvest = getHarvest(parsed.data.harvestId);
  if (!harvest) {
    return {
      ok: false,
      status: 404,
      body: {
        type: "https://khetse.org/errors/harvest-not-found",
        title: "Harvest not found",
        status: 404,
        detail: `No registered harvest matches ${parsed.data.harvestId}.`,
        instance: "/api/plans",
      },
    };
  }

  return {
    ok: true,
    status: 200,
    body: {
      harvestId: harvest.harvestId,
      ...evaluateLogisticsPlans(harvest),
    },
  };
}
