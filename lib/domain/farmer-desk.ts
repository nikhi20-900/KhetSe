import baselineDocument from "@/data/demo-baseline.json";
import {
  evaluateSimulationLab,
  SIMULATION_LAB_PERSISTENCE_NOTE,
} from "@/lib/domain/simulation-lab";
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
  id: string;
  title: string;
  netProceedsInr: number;
  deltaInr: number;
  note: string;
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
  disturbance: {
    detail: string;
    alternatives: FarmerAlternative[];
    recommendedId: string;
    recommendationNote: string;
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
  const freight =
    result.costBreakdownInr.dispatch +
    result.costBreakdownInr.transport +
    result.costBreakdownInr.loading;
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
  const scenario = byId(baselineDocument.scenarios, "alternative-recovery");
  let hours = 0;
  const points: FarmerCheckpoint[] = [
    { label: "Dispatched from Pimpalgaon Baswant", hours: 0 },
  ];
  for (const step of scenario.steps) {
    if (step.type === "travel") {
      const edge = byId(baselineDocument.edges, step.edgeId);
      hours = Number((hours + edge.durationHours).toFixed(2));
      points.push({
        label: node(edge.to).name,
        hours,
      });
    }
    if (step.type === "store") {
      hours = Number((hours + step.holdingHours).toFixed(2));
      points.push({
        label: "Holding at Nashik demo cold room",
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
    {
      id: "repair",
      title: "Repair and continue to Vashi",
      netProceedsInr: repair.comparison.recoveryBranch.netProceedsInr,
      deltaInr: repair.comparison.counterfactualDeltaInr,
      note: "Registered 24-hour stalled-hot repair. This is a modeled checkpoint, not a live van.",
    },
    {
      id: "reroute",
      title: "Cold room, then Pune",
      netProceedsInr: reroute.comparison.recoveryBranch.netProceedsInr,
      deltaInr: reroute.comparison.counterfactualDeltaInr,
      note: "Registered ventilated truck and Nashik cold room. A stored shipment would still need human approval.",
    },
    {
      id: "no-action",
      title: "No action",
      netProceedsInr: noAction.comparison.recoveryBranch.netProceedsInr,
      deltaInr: noAction.comparison.counterfactualDeltaInr,
      note: "Registered 48-hour wait. The delta versus itself is zero.",
    },
  ];
  const bestAlternative = alternatives.reduce((best, item) =>
    item.netProceedsInr > best.netProceedsInr ? item : best
  );
  const recommendationNote =
    bestAlternative.netProceedsInr < 0
      ? `${bestAlternative.title} is the higher modeled result, and it is still a loss. The search does not guarantee the farmer avoids a loss.`
      : `${bestAlternative.title} is the higher modeled result. It is an estimate, not a promise that the farmer avoids a loss.`;

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
    disturbance: {
      detail:
        "A registered breakdown is available after Nashik. The alternatives below are repriced from the same calculator. They are not a live search.",
      alternatives,
      recommendedId: bestAlternative.id,
      recommendationNote,
    },
  };
}
