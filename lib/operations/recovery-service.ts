import { ZodError } from "zod";
import type { PrismaClient } from "@prisma/client";

import {
  injectBreakdownSchema,
  recoveryDecisionSchema,
  DEMO_SHIPMENT_ID,
} from "@/lib/contracts/incident.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import { getPrisma } from "@/lib/db/client";
import {
  ReservationError,
  getReservation,
  swapConsumedShipmentReservation,
  swapReservation,
} from "@/lib/db/queries/reservations";
import {
  applyRecoveryDecision,
  injectBreakdown,
  type OperationsState,
  type RecoveryDecision,
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

export async function executeApprovedRecovery(
  state: OperationsState,
  decision: RecoveryDecision,
  db?: PrismaClient
): Promise<ServiceResult<OperationsState>> {
  const preview = applyRecoveryDecision(state, decision);
  if (!preview.ok) {
    return problem(
      preview.status,
      preview.status === 409
        ? "Capacity Allocation Conflict"
        : "Recovery was not applied",
      preview.detail,
      "/api/incidents",
      preview.status === 409
        ? "https://khetse.org/errors/capacity-conflict"
        : "https://khetse.org/errors/recovery-rejected"
    );
  }
  if (preview.executed) {
    return { ok: true, status: 200, body: preview.state };
  }
  const pending = preview.pendingSwap;
  const reservationId = state.reservation.postgresReservationId;
  if (!pending || !reservationId) {
    return problem(
      409,
      "Capacity Allocation Conflict",
      "No PostgreSQL reservation is linked, so the recovery was not executed.",
      "/api/incidents",
      "https://khetse.org/errors/capacity-conflict"
    );
  }
  try {
    const client = db ?? getPrisma();
    const currentHold = await getReservation(reservationId, client);
    const swapInput = {
      reservationId,
      transportSlotId: pending.transportSlotId,
      storageFacilityId: pending.storageFacilityId,
      occurredAt: new Date(decision.decidedAt),
    };
    const swapped =
      currentHold.status === "CONSUMED"
        ? await swapConsumedShipmentReservation(swapInput, client)
        : await swapReservation(swapInput, client);
    const committed = applyRecoveryDecision(state, decision, {
      nextReservationId: swapped.reservationId,
    });
    if (!committed.ok || !committed.executed) {
      return problem(
        409,
        "Capacity Allocation Conflict",
        "The capacity swap was not recorded. The original reservation is unchanged.",
        "/api/incidents",
        "https://khetse.org/errors/capacity-conflict"
      );
    }
    return { ok: true, status: 200, body: committed.state };
  } catch (error) {
    if (error instanceof ReservationError) {
      return problem(
        error.status,
        error.status === 409
          ? "Capacity Allocation Conflict"
          : "Recovery was not applied",
        error.message,
        "/api/incidents",
        error.status === 409
          ? "https://khetse.org/errors/capacity-conflict"
          : "https://khetse.org/errors/recovery-rejected"
      );
    }
    throw error;
  }
}

export async function submitRecoveryDecision(
  input: unknown,
  decidedAt = new Date().toISOString(),
  db?: PrismaClient
): Promise<ServiceResult<OperationsState>> {
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
  const result = await executeApprovedRecovery(
    current,
    { ...parsed.data, decidedAt },
    db
  );
  if (result.ok) saveIfChanged(current, result.body);
  return result;
}

export function resetDemoShipment(): ServiceResult<OperationsState> {
  return { ok: true, status: 200, body: resetOperations() };
}
