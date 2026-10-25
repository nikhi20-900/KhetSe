import baselineDocument from "@/data/demo-baseline.json";
import type { ItemizedModeledCost } from "@/lib/domain/financials";
import {
  evaluateSimulationLab,
  SimulationLabError,
  SIMULATION_LAB_PERSISTENCE_NOTE,
  type SimulationLabResult,
} from "@/lib/domain/simulation-lab";
import { routeTotals } from "@/scripts/reference-model.mjs";

export const CONTROL_ROOM_CROP = "Nashik Red Onion";
export const CONTROL_ROOM_ORIGIN_ID = "pimpalgaon";

export type ControlDestinationId = "pune" | "vashi";
export type ControlIncidentId =
  "breakdown" | "delay" | "temperature" | "storage-rejection";
export type ControlChoiceId =
  "repair" | "reroute" | "no-action" | "counterexample";

export interface ControlRoomInput {
  cropType?: string;
  quantityKg?: number;
  originId?: string;
  destinationId?: string;
  vehicleId?: string;
  delayHours?: number;
  temperatureExcursionHours?: number;
}

export interface RecoveryOptionView {
  id: ControlChoiceId;
  title: string;
  feasible: boolean;
  unsupportedReason: string | null;
  approvalRequired: boolean;
  approvalNote: string;
  destinationLabel: string;
  arrivalHours: number | null;
  completionHours: number | null;
  deliveredKg: number | null;
  grossProceedsInr: number | null;
  logisticsCostInr: number | null;
  storageCostInr: number | null;
  netProceedsInr: number | null;
  comparisonNetProceedsInr: number | null;
  deltaInr: number | null;
  deltaReading: string | null;
  lines: ItemizedModeledCost[];
  sharedPreIncidentCostInr: number | null;
  spoilageNote: string;
}

export interface IncidentView {
  id: ControlIncidentId;
  label: string;
  supported: boolean;
  detail: string;
  incidentHours: number | null;
  options: RecoveryOptionView[];
}

export interface ControlRoomPreview {
  persisted: false;
  persistenceNote: string;
  cropType: string;
  quantityKg: number;
  originId: typeof CONTROL_ROOM_ORIGIN_ID;
  originName: string;
  destinationId: ControlDestinationId;
  destinationName: string;
  vehicleId: "standard-10t";
  vehicleName: string;
  delayHours: number;
  temperatureExcursionHours: number;
  incidents: IncidentView[];
  storage: {
    nashikName: string;
    vashiName: string;
    nashikAvailableKg: number;
    vashiAvailableKg: number;
    nashikIntakeKg: number;
    vashiIntakeKg: number;
    nashikFeasible: boolean;
    vashiFeasible: boolean;
    nashikReason: string;
    vashiReason: string;
  };
  assumptions: string[];
}

const SPOILAGE_NOTE =
  "Saleable kilograms come from the baseline quality curve at the scenario's effective age. They are not a measured spoilage loss.";

function destinationName(id: ControlDestinationId) {
  const market = baselineDocument.markets.find((item) => item.id === id);
  const node = baselineDocument.nodes.find(
    (item) => item.id === market?.nodeId
  );
  if (!node) throw new SimulationLabError("Unknown destination.");
  return node.name;
}

function storageFacility(id: string) {
  const facility = baselineDocument.storageFacilities.find(
    (item) => item.id === id
  );
  if (!facility) throw new SimulationLabError("Unknown storage facility.");
  return facility;
}

function storageDecision(quantityKg: number, id: string, name: string) {
  const facility = storageFacility(id);
  const fits =
    quantityKg <= facility.availableCapacityKg &&
    quantityKg <= facility.maxIntakeKg;
  const reason = fits
    ? `${name} can take this ${quantityKg} kg preview. Available capacity is ${facility.availableCapacityKg} kg and intake limit is ${facility.maxIntakeKg} kg.`
    : `${name} cannot take ${quantityKg} kg. Available capacity is ${facility.availableCapacityKg} kg and the intake limit is ${facility.maxIntakeKg} kg.`;
  return {
    feasible: fits,
    reason,
    availableKg: facility.availableCapacityKg,
    intakeKg: facility.maxIntakeKg,
  };
}

function deltaReading(delta: number) {
  if (delta > 0) {
    return "The selected preview is higher than its comparison branch. The advantage is a modeled estimate, not a guaranteed saving.";
  }
  if (delta < 0) {
    return "The selected preview is lower than its comparison branch. The disadvantage is a modeled estimate, not a measured loss.";
  }
  return "The selected preview and its comparison branch have the same reference net. The delta is zero.";
}

function unsupportedOption(
  id: ControlChoiceId,
  title: string,
  reason: string
): RecoveryOptionView {
  return {
    id,
    title,
    feasible: false,
    unsupportedReason: reason,
    approvalRequired: false,
    approvalNote: "No preview was calculated.",
    destinationLabel: "Not calculated",
    arrivalHours: null,
    completionHours: null,
    deliveredKg: null,
    grossProceedsInr: null,
    logisticsCostInr: null,
    storageCostInr: null,
    netProceedsInr: null,
    comparisonNetProceedsInr: null,
    deltaInr: null,
    deltaReading: null,
    lines: [],
    sharedPreIncidentCostInr: null,
    spoilageNote: SPOILAGE_NOTE,
  };
}

function fromResult(
  id: ControlChoiceId,
  title: string,
  destinationLabel: string,
  approvalRequired: boolean,
  approvalNote: string,
  result: SimulationLabResult
): RecoveryOptionView {
  const branch = result.comparison.recoveryBranch;
  const delta = result.comparison.counterfactualDeltaInr;
  return {
    id,
    title,
    feasible: true,
    unsupportedReason: null,
    approvalRequired,
    approvalNote,
    destinationLabel,
    arrivalHours: result.arrivalHours,
    completionHours: result.completionHours,
    deliveredKg: branch.deliveredKg,
    grossProceedsInr: branch.grossProceedsInr,
    logisticsCostInr: branch.logisticsCostInr,
    storageCostInr: branch.costBreakdownInr.storage,
    netProceedsInr: branch.netProceedsInr,
    comparisonNetProceedsInr: result.comparison.noActionBranch.netProceedsInr,
    deltaInr: delta,
    deltaReading: deltaReading(delta),
    lines: result.selectedLines,
    sharedPreIncidentCostInr: result.comparison.sharedPreIncidentCostInr,
    spoilageNote: SPOILAGE_NOTE,
  };
}

function previewApproval(changesDestination: boolean) {
  return changesDestination
    ? "Preview only. A stored shipment would still need a named approver, manager sign-off because the receiving place changes, and a linked reservation. This lab does not approve or execute that swap."
    : "Preview only. This lab does not dispatch, reserve capacity, or record an approval.";
}

export function buildControlRoom(
  input: ControlRoomInput = {}
): ControlRoomPreview {
  const cropType = input.cropType ?? CONTROL_ROOM_CROP;
  if (cropType !== CONTROL_ROOM_CROP) {
    throw new SimulationLabError(
      "Only the registered Nashik Red Onion demo crop can be priced."
    );
  }
  const originId = input.originId ?? CONTROL_ROOM_ORIGIN_ID;
  if (originId !== CONTROL_ROOM_ORIGIN_ID) {
    throw new SimulationLabError(
      "Only Pimpalgaon Baswant is the registered origin for these scenarios."
    );
  }
  const destinationId = input.destinationId ?? "pune";
  if (destinationId !== "pune" && destinationId !== "vashi") {
    throw new SimulationLabError(
      "Only the registered Pune and Vashi markets can be selected. Other destinations are unsupported."
    );
  }
  const vehicleId = input.vehicleId ?? "standard-10t";
  if (vehicleId !== "standard-10t") {
    throw new SimulationLabError(
      "The registered breakdown, delay, and no-action scenarios dispatch a standard 10-t truck. Another initial truck is unsupported, so no financial preview was calculated."
    );
  }
  const quantityKg = input.quantityKg ?? 10_000;
  const delayHours = input.delayHours ?? 10;
  const temperatureExcursionHours = input.temperatureExcursionHours ?? 6;
  if (
    !Number.isInteger(temperatureExcursionHours) ||
    temperatureExcursionHours < 1 ||
    temperatureExcursionHours > 24
  ) {
    throw new SimulationLabError(
      "Temperature excursion must be a whole number of hours from 1 to 24."
    );
  }

  const origin = baselineDocument.nodes.find((item) => item.id === originId);
  if (!origin) throw new SimulationLabError("Unknown origin.");
  const vehicle = baselineDocument.vehicles.find(
    (item) => item.id === vehicleId
  );
  if (!vehicle) throw new SimulationLabError("Unknown vehicle.");
  const nashik = storageDecision(
    quantityKg,
    "nashik-demo-cold",
    "Nashik demo cold room"
  );
  const vashi = storageDecision(
    quantityKg,
    "vashi-demo-cold",
    "Vashi demo cold room"
  );
  const breakdownHours = routeTotals(baselineDocument, [
    "pimpalgaon-nashik",
  ]).durationHours;
  const delayIncidentHours = routeTotals(baselineDocument, [
    "pimpalgaon-nashik",
    "nashik-igatpuri",
  ]).durationHours;

  const shared = { quantityKg };
  const repair = evaluateSimulationLab({
    disruptionId: "breakdown",
    responseId: "repair",
    ...shared,
  });
  const reroute = nashik.feasible
    ? evaluateSimulationLab({
        disruptionId: "breakdown",
        responseId: "cold-recovery",
        ...shared,
      })
    : null;
  const noAction = evaluateSimulationLab({
    disruptionId: "breakdown",
    responseId: "no-action",
    ...shared,
  });
  const delayed = evaluateSimulationLab({
    disruptionId: "delay",
    responseId: "delayed-continuation",
    delayPauseHours: delayHours,
    ...shared,
  });
  const hotRepair = evaluateSimulationLab({
    disruptionId: "breakdown",
    responseId: "repair",
    repairPauseHours: 24 + temperatureExcursionHours,
    ...shared,
  });
  const counterexample = evaluateSimulationLab({
    disruptionId: "breakdown",
    responseId: "negative-recovery",
    ...shared,
  });

  const vashiLabel = destinationName("vashi");
  const puneLabel = destinationName("pune");
  const repairOption = fromResult(
    "repair",
    "Repair and continue",
    vashiLabel,
    false,
    previewApproval(destinationId === "pune"),
    repair
  );
  const rerouteOption = reroute
    ? fromResult(
        "reroute",
        "Reroute to Nashik cold storage",
        puneLabel,
        true,
        previewApproval(true),
        reroute
      )
    : unsupportedOption(
        "reroute",
        "Reroute to Nashik cold storage",
        nashik.reason
      );
  const noActionOption = fromResult(
    "no-action",
    "Take no action",
    vashiLabel,
    false,
    previewApproval(false),
    noAction
  );
  const delayedOption = fromResult(
    "no-action",
    "Accept the delay",
    vashiLabel,
    false,
    `${previewApproval(false)} The comparison branch is the undisrupted Vashi route, not the 48-hour breakdown.`,
    delayed
  );
  const hotOption = fromResult(
    "repair",
    "Remain in the stalled-hot pause",
    vashiLabel,
    false,
    `${previewApproval(false)} The extra ${temperatureExcursionHours} h are added to the registered 24 h stalled-hot repair pause. This is not a sensor reading.`,
    hotRepair
  );

  const counterexampleOption = fromResult(
    "counterexample",
    "Registered expensive reefer counterexample",
    puneLabel,
    true,
    `${previewApproval(true)} This is the registered negative case: four reefer vans and a large surcharge. It is not a recommended recovery.`,
    counterexample
  );

  const incidents: IncidentView[] = [
    {
      id: "breakdown",
      label: "Vehicle breakdown",
      supported: true,
      detail:
        "Registered breakdown after the Nashik edge. Repair waits in the stalled-hot environment and then continues to Vashi. No action waits 48 hours. Reroute uses the ventilated truck and Nashik cold storage, then Pune. The reefer counterexample is calculated so a negative delta stays visible.",
      incidentHours: breakdownHours,
      options: [
        repairOption,
        rerouteOption,
        noActionOption,
        counterexampleOption,
      ],
    },
    {
      id: "delay",
      label: "Unexpected transit delay",
      supported: true,
      detail: `Registered pause at Igatpuri for ${delayHours} hours in the ambient environment, then the original Vashi route. Repair and cold reroute are not registered for this delay.`,
      incidentHours: delayIncidentHours,
      options: [
        unsupportedOption(
          "repair",
          "Repair and continue",
          "No registered repair price applies to the Igatpuri delay."
        ),
        unsupportedOption(
          "reroute",
          "Reroute to Nashik cold storage",
          "The registered cold-storage recovery starts from the Nashik breakdown, not from this delay."
        ),
        delayedOption,
      ],
    },
    {
      id: "temperature",
      label: "Temperature excursion",
      supported: true,
      detail: `Modeled only as ${temperatureExcursionHours} extra hours in the registered stalled-hot environment, added to the 24-hour repair pause. There is no separate sensor or temperature-price formula.`,
      incidentHours: breakdownHours,
      options: [
        hotOption,
        unsupportedOption(
          "reroute",
          "Reroute to Nashik cold storage",
          "The registered Nashik recovery does not include this stalled-hot interval, so it was not repriced as if it did."
        ),
        noActionOption,
      ],
    },
    {
      id: "storage-rejection",
      label: "Storage rejection",
      supported: true,
      detail:
        "This incident checks registered cold-room capacity. It does not invent a rejection sale price. Vashi is rejected when the lot exceeds its intake or available kilograms. Nashik reroute is priced only when that room can take the lot.",
      incidentHours: breakdownHours,
      options: [
        unsupportedOption(
          "repair",
          "Repair and continue",
          "Storage rejection is a capacity check, not the paid repair scenario."
        ),
        rerouteOption,
        noActionOption,
      ],
    },
  ];

  return {
    persisted: false,
    persistenceNote: SIMULATION_LAB_PERSISTENCE_NOTE,
    cropType,
    quantityKg,
    originId: CONTROL_ROOM_ORIGIN_ID,
    originName: origin.name,
    destinationId,
    destinationName: destinationName(destinationId),
    vehicleId: "standard-10t",
    vehicleName: vehicle.name,
    delayHours,
    temperatureExcursionHours,
    incidents,
    storage: {
      nashikName: "Nashik demo cold room",
      vashiName: "Vashi demo cold room",
      nashikAvailableKg: nashik.availableKg,
      vashiAvailableKg: vashi.availableKg,
      nashikIntakeKg: nashik.intakeKg,
      vashiIntakeKg: vashi.intakeKg,
      nashikFeasible: nashik.feasible,
      vashiFeasible: vashi.feasible,
      nashikReason: nashik.reason,
      vashiReason: vashi.reason,
    },
    assumptions: [
      "Financial amounts are modeled estimates from the baseline reference calculator. They are not farmer income.",
      "Repair and no action end at Vashi. The Nashik cold-storage reroute ends at Pune. A selected Pune destination does not rewrite those registered endings.",
      "Plan cards elsewhere use the planning catalog, including ventilated ₹72/km. This lab uses the baseline register, including ventilated ₹38/km and a ₹2,800 dispatch.",
      "The lab does not change a stored shipment, reservation, or approval record.",
      vashi.reason,
      nashik.reason,
    ],
  };
}
