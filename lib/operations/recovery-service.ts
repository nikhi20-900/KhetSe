import { ZodError } from "zod";

import {
  injectBreakdownSchema,
  recoveryDecisionSchema,
  DEMO_SHIPMENT_ID,
} from "@/lib/contracts/incident.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import {
  applyRecoveryDecision,
  injectBreakdown,
  type OperationsState,
} from "@/lib/domain/recovery";
import {
  readOperations,
  resetOperations,
  saveIfChanged,
  writeOperations,
} from "@/lib/operations/operations-store";

export type ServiceResult<T> =
  | { ok: true; status: number; body: T }
  | { ok: false; status: number; body: ProblemDetails };

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string,
  type: string
): ServiceResult<never> {
  return {
    ok: false,
    status,
    body: { type, title, status, detail, instance },
  };
}

export function viewShipment(
  shipmentId: string
): ServiceResult<OperationsState> {
  const state = readOperations();
  if (state.shipment.id !== shipmentId) {
    return problem(
      404,
      "Shipment not found",
      "The simulated breakdown shipment is demo-igatpuri. Other shipment ids are not tracked yet.",
      `/api/shipments/${shipmentId}`,
      "https://khetse.org/errors/shipment-not-found"
    );
  }
  return { ok: true, status: 200, body: state };
}

export function viewIncident(
  incidentId: string
): ServiceResult<OperationsState> {
  const state = readOperations();
  if (!state.incident || state.incident.id !== incidentId) {
    return problem(
      404,
      "Incident not found",
      "Inject the simulated breakdown on the demonstration shipment before opening this incident.",
      `/api/incidents/${incidentId}`,
      "https://khetse.org/errors/incident-not-found"
    );
  }
  return { ok: true, status: 200, body: state };
}

export function injectDemoBreakdown(
  input: unknown
): ServiceResult<OperationsState> {
  const parsed = injectBreakdownSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      body: validationProblem(parsed.error, "/api/incidents"),
    };
  }
  if (parsed.data.shipmentId !== DEMO_SHIPMENT_ID) {
    return problem(
      404,
      "Shipment not found",
      "The simulated breakdown can be injected on demo-igatpuri only.",
      "/api/incidents",
      "https://khetse.org/errors/shipment-not-found"
    );
  }
  const current = readOperations();
  const next = injectBreakdown(current);
  if (next !== current) writeOperations(next);
  return { ok: true, status: 200, body: next };
}

export function submitRecoveryDecision(
  input: unknown,
  decidedAt = new Date().toISOString()
): ServiceResult<OperationsState> {
  let parsed: ReturnType<typeof recoveryDecisionSchema.safeParse>;
  try {
    parsed = recoveryDecisionSchema.safeParse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        status: 422,
        body: validationProblem(error, "/api/incidents"),
      };
    }
    throw error;
  }
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      body: validationProblem(parsed.error, "/api/incidents"),
    };
  }

  const current = readOperations();
  const result = applyRecoveryDecision(current, { ...parsed.data, decidedAt });
  if (!result.ok) {
    return problem(
      result.status,
      result.status === 409
        ? "Capacity Allocation Conflict"
        : "Recovery was not applied",
      result.detail,
      "/api/incidents",
      result.status === 409
        ? "https://khetse.org/errors/capacity-conflict"
        : "https://khetse.org/errors/recovery-rejected"
    );
  }
  saveIfChanged(current, result.state);
  return { ok: true, status: 200, body: result.state };
}

export function resetDemoShipment(): ServiceResult<OperationsState> {
  return { ok: true, status: 200, body: resetOperations() };
}
