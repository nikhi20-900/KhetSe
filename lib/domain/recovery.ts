/**
 * Human-approved disruption recovery.
 *
 * Options are calculated from the demo register. Nothing here changes a booking
 * unless applyRecoveryDecision is called with an explicit confirmation.
 * A failed hold returns the same state object that was passed in.
 */

import {
  COLD_STORES,
  DEMO_BREAKDOWN_KM,
  DEMO_CROP_TYPE,
  DEMO_ROUTE_KM,
  DEMO_TRANSIT_HOURS,
  ONION_COLD_STORAGE_BAND_C,
  RECOVERY_DISPATCH_FEE_INR,
  RECOVERY_REROUTE_PER_KM_INR,
  type ColdStore,
} from "@/lib/planning/catalog";
import {
  DEMO_INCIDENT_ID,
  DEMO_SHIPMENT_ID,
} from "@/lib/contracts/incident.contract";
import { formatHours, formatInr, formatKg } from "@/lib/planning/format";

export type ShipmentStatus = "IN_TRANSIT" | "DISRUPTED" | "REROUTED";

export interface CapacityResource {
  id: string;
  label: string;
  kind: "transport" | "storage";
  capacityKg: number;
  availableKg: number;
}

export interface HeldReservation {
  id: string;
  resourceId: string;
  allocatedKg: number;
  status: "CONFIRMED";
}

export interface TimelineEvent {
  id: string;
  at: string;
  kind: "DISPATCHED" | "CHECKPOINT" | "INCIDENT" | "DECISION";
  title: string;
  detail: string;
  urgent: boolean;
}

export interface RecoveryRejection {
  code: "CAPACITY_MISMATCH" | "SHELF_LIFE_EXPIRED";
  category: string;
  message: string;
}

export interface RecoveryOption {
  id: string;
  kind: "STORAGE_REROUTE" | "NO_ACTION";
  resourceId: string | null;
  title: string;
  summary: string;
  feasible: boolean;
  rejection: RecoveryRejection | null;
  changesReceivingWindow: boolean;
  changesCommercialTerms: boolean;
  modeledCostInr: number | null;
  estimateLabel: "Modeled estimate";
  costBasis: string;
  shelfLifeNote: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  incidentId: string;
  action: "APPROVE_RECOVERY_PLAN" | "SELECT_NO_ACTION";
  selectedOptionId: string;
  approvedBy: string;
  managerApprovedBy: string | null;
  approvalNotes: string;
  previousStatus: ShipmentStatus;
  nextStatus: ShipmentStatus;
  reservationBefore: HeldReservation;
  reservationAfter: HeldReservation;
}

export interface ShipmentSnapshot {
  id: string;
  status: ShipmentStatus;
  cropType: string;
  quantityKg: number;
  originName: string;
  destinationName: string;
  receivingWindow: string;
  vehicleName: string;
  harvestTimestamp: string;
  dispatchedAt: string;
  maxShelfLifeHours: number;
  events: TimelineEvent[];
}

export interface IncidentSnapshot {
  id: string;
  shipmentId: string;
  type: "VEHICLE_BREAKDOWN";
  checkpoint: string;
  kilometer: number;
  loggedAt: string;
  remainingShelfLifeHours: number;
  status: "OPEN" | "DECIDED";
  options: RecoveryOption[];
  selectedOptionId: string | null;
}

export interface OperationsState {
  resources: CapacityResource[];
  shipment: ShipmentSnapshot;
  reservation: HeldReservation;
  incident: IncidentSnapshot | null;
  audit: AuditEntry[];
}

export interface RecoveryDecision {
  incidentId: string;
  action: "APPROVE_RECOVERY_PLAN" | "SELECT_NO_ACTION";
  selectedRecoveryPlanId: string;
  approvedBy: string;
  confirmDecision: boolean;
  managerApprovedBy?: string;
  approvalNotes?: string;
  decidedAt: string;
}

export type RecoveryResult =
  | { ok: true; state: OperationsState; idempotent: boolean }
  | {
      ok: false;
      state: OperationsState;
      status: 404 | 409 | 422;
      detail: string;
    };

const HARVEST_AT = "2026-10-25T00:30:00.000Z";
const DISPATCH_AT = "2026-10-25T14:00:00.000Z";

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

function hoursBetween(startIso: string, endIso: string): number {
  return (
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000
  );
}

export function checkpointAt(distanceKm: number): string {
  return addHours(
    DISPATCH_AT,
    DEMO_TRANSIT_HOURS * (distanceKm / DEMO_ROUTE_KM)
  );
}

export function createDemoOperations(): OperationsState {
  const checkpoint1At = checkpointAt(32);
  return {
    resources: [
      {
        id: "ventilated_10t",
        label: "Ventilated 10-T Truck",
        kind: "transport",
        capacityKg: 10_000,
        availableKg: 0,
      },
      ...COLD_STORES.map((store) => ({
        id: store.id,
        label: store.name,
        kind: "storage" as const,
        capacityKg: store.capacityKg,
        availableKg: store.capacityKg,
      })),
    ],
    reservation: {
      id: "res_demo_truck",
      resourceId: "ventilated_10t",
      allocatedKg: 10_000,
      status: "CONFIRMED",
    },
    shipment: {
      id: DEMO_SHIPMENT_ID,
      status: "IN_TRANSIT",
      cropType: DEMO_CROP_TYPE,
      quantityKg: 10_000,
      originName: "Pimpalgaon Baswant, Nashik, Maharashtra",
      destinationName: "Vashi APMC (Navi Mumbai)",
      receivingWindow: "02:00–06:00 IST",
      vehicleName: "Ventilated 10-T Truck",
      harvestTimestamp: HARVEST_AT,
      dispatchedAt: DISPATCH_AT,
      maxShelfLifeHours: 96,
      events: [
        {
          id: "evt_dispatch",
          at: DISPATCH_AT,
          kind: "DISPATCHED",
          title: "Dispatched",
          detail:
            "Modeled departure from Pimpalgaon on the ventilated truck booked for Vashi. This is not a live GPS position.",
          urgent: false,
        },
        {
          id: "evt_checkpoint_1",
          at: checkpoint1At,
          kind: "CHECKPOINT",
          title: "Checkpoint 1, Nashik Agro-Precooling Hub",
          detail:
            "Modeled passage at km 32. No incident is recorded at this marker.",
          urgent: false,
        },
      ],
    },
    incident: null,
    audit: [],
  };
}

function storageOption(
  store: ColdStore,
  availableKg: number,
  quantityKg: number,
  remainingShelfLifeHours: number
): RecoveryOption {
  const distanceKm = Math.abs(store.kilometer - DEMO_BREAKDOWN_KM);
  const modeledCostInr =
    RECOVERY_DISPATCH_FEE_INR +
    Math.round(RECOVERY_REROUTE_PER_KM_INR * distanceKm);
  const rateLabel = Number.isInteger(store.rateInrPerKgWeek)
    ? formatInr(store.rateInrPerKgWeek)
    : `₹${store.rateInrPerKgWeek.toFixed(2)}`;
  const costBasis = `${formatInr(RECOVERY_DISPATCH_FEE_INR)} simulated recovery dispatch plus ${formatInr(RECOVERY_REROUTE_PER_KM_INR)}/km × ${distanceKm} km, using the ventilated demo tariff because no separate recovery rate is registered. The ${rateLabel}/kg/week storage rate is not multiplied into the total: a hold duration is not part of this decision. Classification: ${store.classification === "EMPIRICAL_BENCHMARK" ? "storage rate is an empirical benchmark" : "storage rate is simulated demo data"}.`;
  const shelfLifeNote = `Cold holding uses the registered ${ONION_COLD_STORAGE_BAND_C.min}–${ONION_COLD_STORAGE_BAND_C.max}°C onion band, which is separate from ambient transit. Remaining shelf-life horizon at the breakdown clock: ${formatHours(remainingShelfLifeHours)} hours. That clock is a modeled estimate.`;

  if (quantityKg > availableKg) {
    return {
      id: `rec_${store.id}`,
      kind: "STORAGE_REROUTE",
      resourceId: store.id,
      title: store.name,
      summary: `${store.name} is ${distanceKm} km from the breakdown marker.`,
      feasible: false,
      rejection: {
        code: "CAPACITY_MISMATCH",
        category: "Capacity Mismatch",
        message: `Harvest volume (${formatKg(quantityKg)}) exceeds the available hold at ${store.name} (${formatKg(availableKg)} of ${formatKg(store.capacityKg)}).`,
      },
      changesReceivingWindow: true,
      changesCommercialTerms: true,
      modeledCostInr: null,
      estimateLabel: "Modeled estimate",
      costBasis,
      shelfLifeNote,
    };
  }

  if (remainingShelfLifeHours <= 0) {
    return {
      id: `rec_${store.id}`,
      kind: "STORAGE_REROUTE",
      resourceId: store.id,
      title: store.name,
      summary: `${store.name} is ${distanceKm} km from the breakdown marker.`,
      feasible: false,
      rejection: {
        code: "SHELF_LIFE_EXPIRED",
        category: "Shelf-life Exceeded",
        message: `The declared shelf-life horizon is already exhausted at the breakdown clock, so this hold is not offered.`,
      },
      changesReceivingWindow: true,
      changesCommercialTerms: true,
      modeledCostInr: null,
      estimateLabel: "Modeled estimate",
      costBasis,
      shelfLifeNote,
    };
  }

  return {
    id: `rec_${store.id}`,
    kind: "STORAGE_REROUTE",
    resourceId: store.id,
    title: store.name,
    summary: `Offload at ${store.name}, ${distanceKm} km from the Igatpuri breakdown marker. The Vashi receiving window is given up.`,
    feasible: true,
    rejection: null,
    changesReceivingWindow: true,
    changesCommercialTerms: true,
    modeledCostInr,
    estimateLabel: "Modeled estimate",
    costBasis,
    shelfLifeNote,
  };
}

function noActionOption(remainingShelfLifeHours: number): RecoveryOption {
  return {
    id: "rec_no_action",
    kind: "NO_ACTION",
    resourceId: null,
    title: "No action",
    summary:
      "Leave the load on the broken truck. The original truck booking stays in place. After 18 hours closed and unventilated above 35°C, the register expects 5% weight loss and black mold onset. No roadside price is registered, so proceeds are not estimated.",
    feasible: true,
    rejection: null,
    changesReceivingWindow: true,
    changesCommercialTerms: true,
    modeledCostInr: null,
    estimateLabel: "Modeled estimate",
    costBasis:
      "No recovery dispatch fee is added. A distress-sale price is not in the evidence register.",
    shelfLifeNote: `${formatHours(remainingShelfLifeHours)} hours of the declared shelf-life horizon remain at the breakdown clock. That figure is a modeled estimate.`,
  };
}

export function buildRecoveryOptions(
  state: OperationsState,
  remainingShelfLifeHours: number
): RecoveryOption[] {
  const storage = COLD_STORES.map((store) => {
    const resource = state.resources.find((item) => item.id === store.id);
    return storageOption(
      store,
      resource?.availableKg ?? 0,
      state.shipment.quantityKg,
      remainingShelfLifeHours
    );
  }).sort((left, right) => {
    if (left.feasible !== right.feasible) return left.feasible ? -1 : 1;
    return (
      (left.modeledCostInr ?? Number.MAX_SAFE_INTEGER) -
      (right.modeledCostInr ?? Number.MAX_SAFE_INTEGER)
    );
  });
  return [...storage, noActionOption(remainingShelfLifeHours)];
}

export function injectBreakdown(state: OperationsState): OperationsState {
  if (state.incident) return state;
  const loggedAt = checkpointAt(DEMO_BREAKDOWN_KM);
  const remainingShelfLifeHours =
    state.shipment.maxShelfLifeHours -
    hoursBetween(state.shipment.harvestTimestamp, loggedAt);
  const incident: IncidentSnapshot = {
    id: DEMO_INCIDENT_ID,
    shipmentId: state.shipment.id,
    type: "VEHICLE_BREAKDOWN",
    checkpoint: "Checkpoint 2, Igatpuri Ghat",
    kilometer: DEMO_BREAKDOWN_KM,
    loggedAt,
    remainingShelfLifeHours,
    status: "OPEN",
    options: buildRecoveryOptions(state, remainingShelfLifeHours),
    selectedOptionId: null,
  };
  return {
    ...state,
    shipment: {
      ...state.shipment,
      status: "DISRUPTED",
      events: [
        ...state.shipment.events,
        {
          id: "evt_breakdown",
          at: loggedAt,
          kind: "INCIDENT",
          title: "Simulated vehicle breakdown",
          detail: `Breakdown injected at km ${DEMO_BREAKDOWN_KM}. The truck booking is unchanged until a person approves a recovery option or no action.`,
          urgent: true,
        },
      ],
    },
    incident,
  };
}

function refusal(
  state: OperationsState,
  status: 404 | 409 | 422,
  detail: string
): RecoveryResult {
  return { ok: false, state, status, detail };
}

export function applyRecoveryDecision(
  state: OperationsState,
  decision: RecoveryDecision
): RecoveryResult {
  if (!state.incident || state.incident.id !== decision.incidentId) {
    return refusal(state, 404, "That incident is not on this shipment.");
  }
  if (
    state.incident.status === "DECIDED" &&
    state.incident.selectedOptionId === decision.selectedRecoveryPlanId
  ) {
    return { ok: true, state, idempotent: true };
  }
  if (state.incident.status === "DECIDED") {
    return refusal(
      state,
      422,
      "This incident already has a recorded decision."
    );
  }
  if (!decision.confirmDecision) {
    return refusal(
      state,
      422,
      "Recovery requires explicit approval before any change."
    );
  }
  if (decision.approvedBy.trim().length < 3) {
    return refusal(
      state,
      422,
      "Enter the name of the person approving this decision."
    );
  }

  const option = state.incident.options.find(
    (item) => item.id === decision.selectedRecoveryPlanId
  );
  if (!option) {
    return refusal(state, 422, "That recovery option is not on this incident.");
  }
  if (option.kind === "NO_ACTION" && decision.action !== "SELECT_NO_ACTION") {
    return refusal(
      state,
      422,
      "No action has to be submitted as its own decision."
    );
  }
  if (
    option.kind !== "NO_ACTION" &&
    decision.action !== "APPROVE_RECOVERY_PLAN"
  ) {
    return refusal(
      state,
      422,
      "A storage reroute has to be submitted as a recovery approval."
    );
  }
  if (!option.feasible) {
    return refusal(
      state,
      422,
      option.rejection?.message ?? "That recovery option is not available."
    );
  }
  if (
    (option.changesReceivingWindow || option.changesCommercialTerms) &&
    (decision.managerApprovedBy ?? "").trim().length < 3
  ) {
    return refusal(
      state,
      422,
      "This choice changes the booked receiving window, so a buyer or manager must confirm it."
    );
  }

  if (option.kind === "STORAGE_REROUTE" && option.resourceId) {
    const live = state.resources.find((item) => item.id === option.resourceId);
    if (!live || live.availableKg < state.shipment.quantityKg) {
      return refusal(
        state,
        409,
        "The cold store cannot take this load. The truck booking is unchanged."
      );
    }
  }

  const draft = structuredClone(state);
  const incident = draft.incident;
  if (!incident)
    return refusal(state, 404, "That incident is not on this shipment.");
  const reservationBefore = structuredClone(draft.reservation);
  let nextStatus: ShipmentStatus = draft.shipment.status;
  let detail = "";

  if (option.kind === "NO_ACTION") {
    nextStatus = "DISRUPTED";
    detail =
      "No action selected. The original truck booking stays confirmed. Proceeds are not estimated because no roadside price is registered.";
  } else if (option.resourceId) {
    const store = draft.resources.find((item) => item.id === option.resourceId);
    const truck = draft.resources.find(
      (item) => item.id === reservationBefore.resourceId
    );
    if (!store || !truck || store.availableKg < draft.shipment.quantityKg) {
      return refusal(
        state,
        409,
        "The cold store cannot take this load. The truck booking is unchanged."
      );
    }
    store.availableKg -= draft.shipment.quantityKg;
    truck.availableKg += reservationBefore.allocatedKg;
    draft.reservation = {
      id: `res_${option.id}`,
      resourceId: store.id,
      allocatedKg: draft.shipment.quantityKg,
      status: "CONFIRMED",
    };
    nextStatus = "REROUTED";
    detail = `Approved offload to ${option.title}. The truck hold was released and the cold-store hold was taken in the same decision.`;
  }

  const managerApprovedBy = (decision.managerApprovedBy ?? "").trim();
  const audit: AuditEntry = {
    id: `aud_${incident.id}_${option.id}`,
    at: decision.decidedAt,
    incidentId: incident.id,
    action: decision.action,
    selectedOptionId: option.id,
    approvedBy: decision.approvedBy.trim(),
    managerApprovedBy: managerApprovedBy.length > 0 ? managerApprovedBy : null,
    approvalNotes: (decision.approvalNotes ?? "").trim(),
    previousStatus: draft.shipment.status,
    nextStatus,
    reservationBefore,
    reservationAfter: structuredClone(draft.reservation),
  };
  draft.audit = [...draft.audit, audit];
  draft.shipment = {
    ...draft.shipment,
    status: nextStatus,
    events: [
      ...draft.shipment.events,
      {
        id: "evt_decision",
        at: decision.decidedAt,
        kind: "DECISION",
        title:
          option.kind === "NO_ACTION"
            ? "No action approved"
            : "Recovery approved",
        detail,
        urgent: false,
      },
    ],
  };
  draft.incident = {
    ...incident,
    status: "DECIDED",
    selectedOptionId: option.id,
  };
  return { ok: true, state: draft, idempotent: false };
}
