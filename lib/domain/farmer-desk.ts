import baselineDocument from "@/data/demo-baseline.json";
import {
  evaluateSimulationLab,
  SIMULATION_LAB_PERSISTENCE_NOTE,
} from "@/lib/domain/simulation-lab";
import type { ItemizedModeledCost } from "@/lib/domain/financials";
import { nashikMarkerIndex } from "@/lib/domain/breakdown-control";
import {
  byId,
  evaluateScenario,
  routeTotals,
} from "@/scripts/reference-model.mjs";

export interface FarmerOffer {
  id: string;
  name: string;
  kind: "nearby-mandi" | "mandi" | "premium-buyer";
  latitudeDeg: number;
  longitudeDeg: number;
  priceInrPerKg: number;
  distanceKm: number;
  durationHours: number;
  vehicleName: string;
  saleableKg: number;
  wastageKg: number;
  grossProceedsInr: number;
  freightInr: number;
  otherCostsInr: number;
  totalCostInr: number;
  netProceedsInr: number;
  basis: string;
}

export interface FarmerCheckpoint {
  label: string;
  hours: number;
}

export interface FarmerAlternative {
  id: "repair" | "reroute" | "no-action";
  title: string;
  netProceedsInr: number;
  deltaInr: number;
  note: string;
  assumption: string;
  saleableKg: number;
  wastageKg: number;
  grade: string;
  qualityFraction: number;
  freightInr: number;
  otherCostsInr: number;
  totalCostInr: number;
  grossProceedsInr: number;
  interventionCostInr: number;
  interventionLineInr: number;
  arrivalHours: number;
  completionHours: number;
  effectiveAgeHours: number;
  lines: ItemizedModeledCost[];
  checkpoints: FarmerCheckpoint[];
  breakdownMarkerIndex: number;
}

export interface FarmerDesk {
  persisted: false;
  persistenceNote: string;
  originName: string;
  latitudeDeg: number;
  longitudeDeg: number;
  weather: {
    temperatureC: number;
    relativeHumidityPct: number;
    label: string;
  };
  quantityKg: number;
  offers: FarmerOffer[];
  recommendedMandiId: string;
  premiumOfferId: string;
  coldRoute: FarmerCheckpoint[];
  coldPricedArrivalHours: number;
  coldPricedCompletionHours: number;
  breakdownMarkerIndex: number;
  disturbance: {
    detail: string;
    alternatives: FarmerAlternative[];
    recommendedId: FarmerAlternative["id"];
    recommendationNote: string;
    undisturbedVashiNetInr: number;
  };
}

function node(id: string) {
  return byId(baselineDocument.nodes, id);
}

function market(id: string) {
  return byId(baselineDocument.markets, id);
}

function offerFromScenario(
  id: string,
  name: string,
  kind: FarmerOffer["kind"],
  nodeId: string,
  vehicleName: string,
  edgeIds: string[],
  scenario: {
    id: string;
    marketId: string;
    steps: Array<Record<string, unknown>>;
  },
  basis: string
): FarmerOffer {
  const result = evaluateScenario(baselineDocument, scenario);
  const place = node(nodeId);
  const price = market(scenario.marketId).priceInrPerKg;
  const route = routeTotals(baselineDocument, edgeIds);
  const costs = result.costBreakdownInr;
  const freight = freightInr({
    dispatch: costs.dispatch ?? 0,
    transport: costs.transport ?? 0,
    loading: costs.loading ?? 0,
  });
  const wastageKg = Number(
    (baselineDocument.crop.quantityKg - result.saleableKg).toFixed(3)
  );
  return {
    id,
    name,
    kind,
    latitudeDeg: place.latitudeDeg,
    longitudeDeg: place.longitudeDeg,
    priceInrPerKg: price,
    distanceKm: route.distanceKm,
    durationHours: route.durationHours,
    vehicleName,
    saleableKg: result.saleableKg,
    wastageKg,
    grossProceedsInr: result.grossProceedsInr,
    freightInr: Number(freight.toFixed(2)),
    otherCostsInr: Number((result.totalCostsInr - freight).toFixed(2)),
    totalCostInr: result.totalCostsInr,
    netProceedsInr: result.netProceedsInr,
    basis,
  };
}

function freightInr(costs: {
  dispatch: number;
  transport: number;
  loading: number;
}) {
  return Number((costs.dispatch + costs.transport + costs.loading).toFixed(2));
}

function alternativeFromLab(
  id: FarmerAlternative["id"],
  title: string,
  note: string,
  scenarioId: string,
  result: ReturnType<typeof evaluateSimulationLab>
): FarmerAlternative {
  const branch = result.comparison.recoveryBranch;
  const freight = freightInr(branch.costBreakdownInr);
  const wastageKg = Number(
    (baselineDocument.crop.quantityKg - branch.deliveredKg).toFixed(3)
  );
  const checkpoints = checkpointsForScenario(scenarioId);
  return {
    id,
    title,
    netProceedsInr: branch.netProceedsInr,
    deltaInr: result.comparison.counterfactualDeltaInr,
    note,
    assumption: byId(baselineDocument.scenarios, scenarioId).description,
    saleableKg: branch.deliveredKg,
    wastageKg,
    grade: branch.grade,
    qualityFraction: branch.qualityFraction,
    freightInr: freight,
    otherCostsInr: Number((branch.logisticsCostInr - freight).toFixed(2)),
    totalCostInr: branch.logisticsCostInr,
    grossProceedsInr: branch.grossProceedsInr,
    interventionCostInr: branch.interventionCostInr,
    interventionLineInr: branch.costBreakdownInr.intervention,
    arrivalHours: result.arrivalHours,
    completionHours: result.completionHours,
    effectiveAgeHours: result.effectiveAgeHours,
    lines: result.selectedLines,
    checkpoints,
    breakdownMarkerIndex: nashikMarkerIndex(checkpoints),
  };
}

function directScenario(marketId: string, edgeIds: string[]) {
  return {
    id: `farmer-${marketId}`,
    marketId,
    steps: [
      {
        type: "dispatch",
        vehicleId: "standard-10t",
        count: 1,
        surchargeInr: 0,
      },
      ...edgeIds.map((edgeId) => ({ type: "travel", edgeId })),
    ],
  };
}

function coldCheckpoints(): FarmerCheckpoint[] {
  return checkpointsForScenario("alternative-recovery");
}

function checkpointsForScenario(scenarioId: string): FarmerCheckpoint[] {
  const scenario = byId(baselineDocument.scenarios, scenarioId);
  let hours = 0;
  const points: FarmerCheckpoint[] = [
    { label: "Dispatched from Pimpalgaon Baswant", hours: 0 },
  ];
  for (const step of scenario.steps) {
    if (step.type === "travel" && "edgeId" in step) {
      const edge = byId(baselineDocument.edges, step.edgeId);
      hours = Number((hours + edge.durationHours).toFixed(2));
      points.push({ label: node(edge.to).name, hours });
      continue;
    }
    if (step.type === "store" && "holdingHours" in step) {
      hours = Number((hours + step.holdingHours).toFixed(2));
      points.push({
        label: "Holding at Nashik demo cold room (fictional)",
        hours,
      });
      continue;
    }
    if (step.type === "pause" && "durationHours" in step) {
      hours = Number((hours + step.durationHours).toFixed(2));
      const environment =
        "environmentId" in step && typeof step.environmentId === "string"
          ? step.environmentId.replaceAll("-", " ")
          : "registered";
      points.push({
        label: `Registered ${step.durationHours}-hour ${environment} pause`,
        hours,
      });
    }
  }
  return points;
}

export function buildFarmerDesk(): FarmerDesk {
  const origin = node(baselineDocument.crop.originNodeId);
  const ambient = byId(baselineDocument.environments, "ambient");
  const vashiRoute = byId(baselineDocument.routes, "primary-vashi").edgeIds;
  const puneRoute = byId(baselineDocument.routes, "secondary-pune").edgeIds;
  const suratRoute = byId(baselineDocument.routes, "secondary-surat").edgeIds;
  const offers = [
    offerFromScenario(
      "vashi-mandi",
      "Vashi APMC",
      "nearby-mandi",
      "vashi",
      "Standard 10-T truck",
      vashiRoute,
      directScenario("vashi", vashiRoute),
      "Registered Vashi route priced by the baseline calculator on a standard truck."
    ),
    offerFromScenario(
      "pune-mandi",
      "Pune APMC",
      "mandi",
      "pune",
      "Standard 10-T truck",
      puneRoute,
      directScenario("pune", puneRoute),
      "Registered Pune road priced by the baseline calculator on a standard truck."
    ),
    offerFromScenario(
      "surat-mandi",
      "Surat APMC",
      "mandi",
      "surat",
      "Standard 10-T truck",
      suratRoute,
      directScenario("surat", suratRoute),
      "Registered Surat road priced by the baseline calculator. The exact yard is unverified."
    ),
    offerFromScenario(
      "pune-premium",
      "Pune premium buyer",
      "premium-buyer",
      "pune",
      "Ventilated truck and Nashik cold room",
      byId(baselineDocument.routes, "storage-recovery-pune").edgeIds,
      byId(baselineDocument.scenarios, "alternative-recovery"),
      "Registered cold-van recovery to Pune. A photo attachment is a demonstration step, not an image grade."
    ),
  ];
  const mandis = offers.filter((offer) => offer.kind !== "premium-buyer");
  const recommended = mandis.reduce((best, offer) =>
    offer.netProceedsInr > best.netProceedsInr ? offer : best
  );
  const repair = evaluateSimulationLab({
    disruptionId: "breakdown",
    responseId: "repair",
  });
  const reroute = evaluateSimulationLab({
    disruptionId: "breakdown",
    responseId: "cold-recovery",
  });
  const noAction = evaluateSimulationLab({
    disruptionId: "breakdown",
    responseId: "no-action",
  });
  const alternatives: FarmerAlternative[] = [
    alternativeFromLab(
      "repair",
      "Repair, then Vashi",
      "Registered 24-hour stalled-hot repair. This is a modeled checkpoint, not a live van.",
      "vehicle-breakdown",
      repair
    ),
    alternativeFromLab(
      "reroute",
      "Cold room, then Pune",
      "Registered ventilated truck and Nashik cold room. A stored shipment would still need human approval.",
      "alternative-recovery",
      reroute
    ),
    alternativeFromLab(
      "no-action",
      "No action, then Vashi",
      "Registered 48-hour wait. The delta versus itself is zero.",
      "no-action",
      noAction
    ),
  ];
  const bestAlternative = alternatives.reduce((best, item) =>
    item.netProceedsInr > best.netProceedsInr ? item : best
  );
  const undisturbed = offers.find((offer) => offer.id === "vashi-mandi");
  if (!undisturbed) {
    throw new Error("The undisturbed Vashi offer is missing.");
  }
  const recommendationNote = `${bestAlternative.title} has the highest modeled net of these three breakdown responses. The undisturbed Vashi sale is a separate scenario. This estimate is not a promise that the farmer avoids a loss.`;

  return {
    persisted: false,
    persistenceNote: SIMULATION_LAB_PERSISTENCE_NOTE,
    originName: origin.name,
    latitudeDeg: origin.latitudeDeg,
    longitudeDeg: origin.longitudeDeg,
    weather: {
      temperatureC: ambient.temperatureC,
      relativeHumidityPct: ambient.relativeHumidityPct,
      label:
        "Demonstration weather for the registered ambient onion band. It is not a live forecast.",
    },
    quantityKg: baselineDocument.crop.quantityKg,
    offers,
    recommendedMandiId: recommended.id,
    premiumOfferId: "pune-premium",
    coldRoute: coldCheckpoints(),
    coldPricedArrivalHours: reroute.arrivalHours,
    coldPricedCompletionHours: reroute.completionHours,
    breakdownMarkerIndex: nashikMarkerIndex(coldCheckpoints()),
    disturbance: {
      detail:
        "A registered breakdown is available after Nashik. Choose one of the three registered responses. Advancing a checkpoint does not recalculate these rupees.",
      alternatives,
      recommendedId: bestAlternative.id,
      recommendationNote,
      undisturbedVashiNetInr: undisturbed.netProceedsInr,
    },
  };
}
