import baselineJson from "@/data/demo-baseline.json";
import { CANONICAL_SHIPMENT_ID } from "@/lib/demo/constants";
import { qualityAtAge } from "@/lib/domain/simulation";
import {
  evaluateAll as evaluateAllUntyped,
  evaluateScenario as evaluateScenarioUntyped,
} from "@/scripts/reference-model.mjs";

interface ScenarioMilestone {
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

interface ScenarioEvaluation {
  id: string;
  marketId: string;
  distanceKm: number;
  arrivalHours: number;
  waitingHours: number;
  completionHours: number;
  grade: string;
  qualityFraction: number;
  saleableKg: number;
  grossProceedsInr: number;
  totalCostsInr: number;
  netProceedsInr: number;
  interventionCostInr: number;
  costBreakdownInr: Record<string, number>;
  milestones: ScenarioMilestone[];
  incrementalNetInr?: number;
}

interface BaselineScenario {
  id: string;
  marketId: string;
  description?: string;
  steps: Array<Record<string, unknown>>;
}

interface BaselineData {
  crop: {
    originNodeId: string;
    quantityKg: number;
    bulkDensityKgPerM3: number;
    name: string;
    initialGrade: string;
    referenceShelfLifeHours: number;
  };
  clock: {
    dispatchAt: string;
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
  }>;
  markets: Array<{
    id: string;
    unloadingSlotsLocalHours: number[][];
  }>;
  storageFacilities: Array<{ id: string; nodeId: string }>;
  scenarios: BaselineScenario[];
}

const evaluateScenario = evaluateScenarioUntyped as (
  data: BaselineData,
  scenario: BaselineScenario
) => ScenarioEvaluation;

const evaluateAll = evaluateAllUntyped as (
  data: BaselineData
) => ScenarioEvaluation[];

/**
 * Presentation model for the canonical demo journey.
 * Distances, times, quality and money come from scripts/reference-model.mjs.
 * The intake catalog in lib/planning/catalog.ts is a separate register.
 */

const baseline = baselineJson as BaselineData;

export { CANONICAL_SHIPMENT_ID };

export const MARKET_IDS = ["vashi", "pune", "surat"] as const;
export type MarketId = (typeof MARKET_IDS)[number];

export const RECOVERY_IDS = [
  "alternative-recovery",
  "vehicle-breakdown",
  "no-action",
  "negative-recovery",
] as const;
export type RecoveryId = (typeof RECOVERY_IDS)[number];

const MARKET_ROUTE: Record<MarketId, string> = {
  vashi: "primary-vashi",
  pune: "secondary-pune",
  surat: "secondary-surat",
};

const MARKET_NAME: Record<string, string> = {
  vashi: "Vashi APMC",
  pune: "Pune APMC",
  surat: "Surat APMC",
};

const NODE_LABEL: Record<string, string> = {
  pimpalgaon: "Pimpalgaon Baswant",
  nashik: "Nashik",
  igatpuri: "Igatpuri",
  vashi: "Vashi APMC",
  pune: "Pune APMC",
  surat: "Surat APMC",
  "nashik-cold": "Nashik cold room",
  "vashi-cold": "Vashi cold room",
};

export const COST_LABELS: Record<string, string> = {
  dispatch: "Dispatch",
  transport: "Transport",
  loading: "Loading",
  intervention: "Repair / surcharge",
  storage: "Storage",
  detention: "Detention",
  unloading: "Unloading",
  marketFees: "Market fee",
};

export interface MapPoint {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  role: "origin" | "checkpoint" | "destination" | "incident";
  labeled?: boolean;
}

export interface MapLine {
  id: string;
  label: string;
  style: "solid" | "dashed";
  tone: "green" | "red";
  pointIds: string[];
}

export interface CostRow {
  key: string;
  label: string;
  amountInr: number;
}

export interface DirectPlan {
  marketId: MarketId;
  destination: string;
  routeId: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCount: number;
  distanceKm: number;
  transitHours: number;
  arrivalHours: number;
  waitingHours: number;
  completionHours: number;
  logisticsCostInr: number;
  netProceedsInr: number;
  grossProceedsInr: number;
  saleableKg: number;
  grade: string;
  capacityKg: number;
  requiredKg: number;
  volumeM3: number;
  vehicleVolumeM3: number;
  badges: string[];
  via: string;
  unloadingWindow: string;
  costRows: CostRow[];
  pointIds: string[];
  shelfLifeNote: string | null;
  feasible: true;
}

export interface VehicleBlock {
  vehicleName: string;
  count: number;
  capacityKg: number;
  requiredKg: number;
  fleetCount: number;
  fleetCouldFit: boolean;
  message: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  detail: string;
  atHours: number;
}

export interface ApprovalFacts {
  title: string;
  transferAt: string;
  vehicle: string;
  storage: string;
  destination: string;
  interventionInr: number;
  netInr: number;
  deltaInr: number | null;
  journeyNote: string;
}

export interface RecoveryView {
  id: RecoveryId;
  title: string;
  eyebrow: string;
  summary: string;
  description: string;
  destination: string;
  grade: string;
  completionHours: number;
  arrivalHours: number;
  waitingHours: number;
  onwardHours: number;
  netProceedsInr: number;
  grossProceedsInr: number;
  totalCostsInr: number;
  saleableKg: number;
  qualityFraction: number;
  interventionCostInr: number;
  deltaInr: number | null;
  recommended: boolean;
  tone: "recommended" | "option" | "baseline" | "negative";
  timeline: TimelineEntry[];
  costRows: CostRow[];
  points: MapPoint[];
  lines: MapLine[];
  approval: ApprovalFacts;
}

export function isMarketId(value: string | undefined): value is MarketId {
  return MARKET_IDS.some((id) => id === value);
}

export function readQuantityKg(value: string | undefined): number {
  if (!value) return baseline.crop.quantityKg;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100_000) {
    return baseline.crop.quantityKg;
  }
  return parsed;
}

export function lotQuery(quantityKg: number): string {
  return quantityKg === baseline.crop.quantityKg
    ? ""
    : `&kg=${encodeURIComponent(String(quantityKg))}`;
}

export function isRecoveryId(value: string | undefined): value is RecoveryId {
  return RECOVERY_IDS.some((id) => id === value);
}

export function lotVolumeM3(quantityKg = baseline.crop.quantityKg): number {
  return quantityKg / baseline.crop.bulkDensityKgPerM3;
}

export function referenceShelfLifeHours(): number {
  return baseline.crop.referenceShelfLifeHours;
}

export function cropProfile() {
  const dispatch = dispatchQuality();
  return {
    name: baseline.crop.name,
    quantityKg: baseline.crop.quantityKg,
    volumeM3: lotVolumeM3(),
    shelfLifeHours: baseline.crop.referenceShelfLifeHours,
    grade: baseline.crop.initialGrade,
    originName: nodeLabel(baseline.crop.originNodeId),
    originRegion: "Maharashtra",
    dispatchAt: baseline.clock.dispatchAt,
    harvestWindowEnd: baseline.clock.harvestWindowEnd,
    dispatchQuality: dispatch.qualityFraction,
    dispatchGrade: dispatch.grade,
    handling:
      "Dry, ventilated handling · No mandatory chilled transport",
  };
}

export function dispatchQuality() {
  return qualityAtAge(0);
}

export function nodeLabel(id: string): string {
  return NODE_LABEL[id] ?? id;
}

export function marketName(id: string): string {
  return MARKET_NAME[id] ?? id;
}

function edgeById(id: string) {
  const edge = baseline.edges.find((item) => item.id === id);
  if (!edge) throw new Error(`Unknown edge ${id}`);
  return edge;
}

function nodeById(id: string) {
  const node = baseline.nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Unknown node ${id}`);
  return node;
}

function vehicleById(id: string) {
  const vehicle = baseline.vehicles.find((item) => item.id === id);
  if (!vehicle) throw new Error(`Unknown vehicle ${id}`);
  return vehicle;
}

function scenarioById(id: string): BaselineScenario {
  const scenario = baseline.scenarios.find((item) => item.id === id);
  if (!scenario) throw new Error(`Unknown scenario ${id}`);
  return scenario;
}

function dataForQuantity(quantityKg: number): BaselineData {
  if (quantityKg === baseline.crop.quantityKg) return baseline;
  return { ...baseline, crop: { ...baseline.crop, quantityKg } };
}

/** Same mass and volume test as assertVehicleCapacity in the reference model. */
export function vehicleFits(
  vehicleId: string,
  count: number,
  quantityKg: number
): boolean {
  const vehicle = vehicleById(vehicleId);
  const volume = quantityKg / baseline.crop.bulkDensityKgPerM3;
  return (
    quantityKg <= vehicle.capacityKg * count &&
    volume <= vehicle.capacityM3 * count
  );
}

function pointIdsForEdges(edgeIds: string[]): string[] {
  const ids = [baseline.crop.originNodeId];
  for (const edgeId of edgeIds) ids.push(edgeById(edgeId).to);
  return ids;
}

function travelEdgeIds(scenario: BaselineScenario): string[] {
  return scenario.steps
    .filter((step) => step.type === "travel")
    .map((step) => String(step.edgeId));
}

export function toMapPoint(
  id: string,
  role: MapPoint["role"]
): MapPoint {
  const node = nodeById(id);
  return {
    id,
    label: nodeLabel(id),
    latitude: node.latitudeDeg,
    longitude: node.longitudeDeg,
    role,
    labeled: !id.endsWith("-cold"),
  };
}

function unloadingWindow(marketId: string): string {
  const market = baseline.markets.find((item) => item.id === marketId);
  const slot = market?.unloadingSlotsLocalHours[0];
  if (!slot) return "Registered window";
  const hour = (value: number) => `${String(value).padStart(2, "0")}:00`;
  return `${hour(slot[0])}–${hour(slot[1])} IST`;
}

function viaLabel(pointIds: string[]): string {
  const middle = pointIds.slice(1, -1).map(nodeLabel);
  return middle.length > 0 ? `Via ${middle.join(" and ")}` : "Direct checkpoint link";
}

export function costRowsOf(result: ScenarioEvaluation): CostRow[] {
  return Object.entries(result.costBreakdownInr)
    .filter(([, amount]) => amount !== 0)
    .map(([key, amountInr]) => ({
      key,
      label: COST_LABELS[key] ?? key,
      amountInr,
    }));
}

export function singleReeferBlock(quantityKg: number): VehicleBlock | null {
  const van = vehicleById("reefer-van");
  if (vehicleFits(van.id, 1, quantityKg)) return null;
  const fleetCouldFit = vehicleFits(van.id, van.availableCount, quantityKg);
  return {
    vehicleName: van.name,
    count: 1,
    capacityKg: van.capacityKg,
    requiredKg: quantityKg,
    fleetCount: van.availableCount,
    fleetCouldFit,
    message: `${formatKgPlain(van.capacityKg)} capacity against ${formatKgPlain(quantityKg)} required.${
      fleetCouldFit
        ? ` A ${van.availableCount}-van fleet needs a separate cost and availability check.`
        : ""
    }`,
  };
}

function formatKgPlain(quantityKg: number): string {
  return `${new Intl.NumberFormat("en-IN").format(quantityKg)} kg`;
}

function directScenario(marketId: MarketId): BaselineScenario {
  const route = baseline.routes.find((item) => item.id === MARKET_ROUTE[marketId]);
  if (!route) throw new Error(`Missing route for ${marketId}`);
  return {
    id: `direct-${marketId}`,
    marketId,
    steps: [
      {
        type: "dispatch",
        vehicleId: "standard-10t",
        count: 1,
        surchargeInr: 0,
      },
      ...route.edgeIds.map((edgeId) => ({ type: "travel", edgeId })),
    ],
  };
}

export function directMarketPlans(
  quantityKg = baseline.crop.quantityKg,
  declaredShelfLifeHours?: number
): { plans: DirectPlan[]; blocked: VehicleBlock | null; reefer: VehicleBlock | null } {
  const truck = vehicleById("standard-10t");
  const reefer = singleReeferBlock(quantityKg);
  if (!vehicleFits(truck.id, 1, quantityKg)) {
    return {
      plans: [],
      blocked: {
        vehicleName: truck.name,
        count: 1,
        capacityKg: truck.capacityKg,
        requiredKg: quantityKg,
        fleetCount: truck.availableCount,
        fleetCouldFit: false,
        message: `${truck.name} payload is ${formatKgPlain(truck.capacityKg)}. This lot is ${formatKgPlain(quantityKg)}, so none of the direct routes are feasible.`,
      },
      reefer,
    };
  }

  const data = dataForQuantity(quantityKg);
  const plans = MARKET_IDS.map((marketId) => {
    const result = evaluateScenario(data, directScenario(marketId));
    const pointIds = pointIdsForEdges(
      baseline.routes.find((item) => item.id === MARKET_ROUTE[marketId])!.edgeIds
    );
    const plan: DirectPlan = {
      marketId,
      destination: marketName(marketId),
      routeId: MARKET_ROUTE[marketId],
      vehicleId: truck.id,
      vehicleName: truck.name,
      vehicleCount: 1,
      distanceKm: result.distanceKm,
      transitHours: result.arrivalHours,
      arrivalHours: result.arrivalHours,
      waitingHours: result.waitingHours,
      completionHours: result.completionHours,
      logisticsCostInr: result.totalCostsInr,
      netProceedsInr: result.netProceedsInr,
      grossProceedsInr: result.grossProceedsInr,
      saleableKg: result.saleableKg,
      grade: result.grade,
      capacityKg: truck.capacityKg,
      requiredKg: quantityKg,
      volumeM3: lotVolumeM3(quantityKg),
      vehicleVolumeM3: truck.capacityM3,
      badges: [],
      via: viaLabel(pointIds),
      unloadingWindow: unloadingWindow(marketId),
      costRows: costRowsOf(result),
      pointIds,
      shelfLifeNote:
        declaredShelfLifeHours != null &&
        result.completionHours > declaredShelfLifeHours
          ? `Modeled completion is ${result.completionHours} h, past the declared ${declaredShelfLifeHours} h horizon.`
          : null,
      feasible: true,
    };
    return plan;
  });

  const lowest = [...plans].sort(
    (a, b) => a.logisticsCostInr - b.logisticsCostInr
  )[0];
  const fastest = [...plans].sort(
    (a, b) => a.transitHours - b.transitHours || b.netProceedsInr - a.netProceedsInr
  )[0];
  const richest = [...plans].sort(
    (a, b) => b.netProceedsInr - a.netProceedsInr
  )[0];
  for (const plan of plans) {
    if (plan === lowest) plan.badges.push("Lowest logistics cost");
    else if (plan === fastest && plan === richest) {
      plan.badges.push("Fastest transit · highest net");
    } else if (plan === fastest) plan.badges.push("Fastest transit");
    else if (plan === richest) plan.badges.push("Highest modeled net");
    else plan.badges.push("Alternative destination");
  }

  return { plans, blocked: null, reefer };
}

export function planByMarket(
  marketId: MarketId,
  quantityKg = baseline.crop.quantityKg
): DirectPlan | null {
  return (
    directMarketPlans(quantityKg).plans.find((plan) => plan.marketId === marketId) ??
    null
  );
}

export function routeMap(
  pointIds: string[],
  destinationId: string,
  incidentId?: string
): { points: MapPoint[]; lines: MapLine[] } {
  const points = pointIds.map((id) =>
    toMapPoint(
      id,
      id === pointIds[0]
        ? "origin"
        : id === incidentId
          ? "incident"
          : id === destinationId
            ? "destination"
            : "checkpoint"
    )
  );
  return {
    points,
    lines: [
      {
        id: "selected",
        label: `${nodeLabel(pointIds[0])} → ${nodeLabel(destinationId)}`,
        style: "solid",
        tone: "green",
        pointIds,
      },
    ],
  };
}

function lastIndex(
  milestones: ScenarioMilestone[],
  kinds: string[]
): number {
  let found = -1;
  milestones.forEach((milestone, index) => {
    if (kinds.includes(milestone.kind)) found = index;
  });
  return found;
}

function timelineFor(result: ScenarioEvaluation): {
  entries: TimelineEntry[];
  onwardHours: number;
} {
  const milestones = result.milestones;
  const actionIndex = lastIndex(milestones, [
    "transfer",
    "pause",
    "release",
    "hold",
    "intake",
  ]);
  const entries: TimelineEntry[] = [];
  milestones.forEach((milestone, index) => {
    if (actionIndex >= 0 && index > actionIndex) return;
    if (["arrival", "wait", "unload", "dispatch"].includes(milestone.kind)) {
      return;
    }
    const next = milestones[index + 1];
    if (milestone.kind === "travel" && next?.kind === "intake") return;
    const previous = milestones[index - 1];
    const positioning =
      milestone.kind === "intake" && previous?.kind === "travel"
        ? previous
        : undefined;
    entries.push({
      id: `${milestone.kind}-${index}`,
      title: timelineTitle(milestone),
      detail: positioning
        ? `Includes ${positioning.durationHours ?? 0} h positioning to the cold room. Simulated checkpoint link, not road geometry.`
        : "Simulated checkpoint timing from the baseline scenario.",
      atHours: milestone.elapsedHours,
    });
  });
  const action = actionIndex >= 0 ? milestones[actionIndex] : undefined;
  const onwardHours = Number(
    (result.arrivalHours - (action?.elapsedHours ?? 0)).toFixed(2)
  );
  return { entries, onwardHours };
}

function timelineTitle(milestone: ScenarioMilestone): string {
  const hours = milestone.durationHours ?? 0;
  const compact = `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(hours)} h`;
  if (milestone.kind === "travel" && milestone.nodeId === "nashik") {
    return "Breakdown recorded at Nashik";
  }
  if (milestone.kind === "transfer") {
    const vehicle = milestone.vehicleId
      ? vehicleById(milestone.vehicleId)
      : undefined;
    return `Transfer to ${vehicle?.name.toLowerCase() ?? "replacement vehicle"} · ${compact}`;
  }
  if (milestone.kind === "intake") return `Cold room intake complete · ${compact}`;
  if (milestone.kind === "hold") return `Cold storage hold · ${compact}`;
  if (milestone.kind === "release") return `Conditioned release complete · ${compact}`;
  if (milestone.kind === "pause") {
    return (milestone.costInr ?? 0) > 0
      ? `Paid repair · ${compact}`
      : `Included repair wait · ${compact}`;
  }
  if (milestone.kind === "travel") {
    return `Checkpoint ${nodeLabel(milestone.nodeId ?? "")} · ${compact}`;
  }
  return milestone.kind;
}

function recoveryCopy(id: RecoveryId, scenario: BaselineScenario): {
  title: string;
  eyebrow: string;
  summary: string;
  tone: RecoveryView["tone"];
} {
  const pause = scenario.steps.find((step) => step.type === "pause");
  const replacement = scenario.steps.filter((step) => step.type === "dispatch")[1];
  if (id === "alternative-recovery") {
    const vehicle = replacement
      ? vehicleById(String(replacement.vehicleId))
      : undefined;
    return {
      title: "Transfer + cold storage",
      eyebrow: "Recommended in this demo",
      summary: `${vehicle?.name ?? "Replacement vehicle"} → Nashik cold room → ${marketName(scenario.marketId)}`,
      tone: "recommended",
    };
  }
  if (id === "vehicle-breakdown") {
    return {
      title: "Repair + continue",
      eyebrow: "Paid repair",
      summary: `${pause?.durationHours ?? 0}-hour repair → original ${marketName(scenario.marketId)} route`,
      tone: "option",
    };
  }
  if (id === "no-action") {
    return {
      title: "No action",
      eyebrow: "Baseline",
      summary: `Wait ${pause?.durationHours ?? 0} h for included repair → ${marketName(scenario.marketId)}`,
      tone: "baseline",
    };
  }
  const count = replacement ? Number(replacement.count) : 0;
  return {
    title: "Four-van transfer",
    eyebrow: "Worse than no action",
    summary: `${count} × reefer van → ${marketName(scenario.marketId)}. Intervention costs exceed salvage proceeds.`,
    tone: "negative",
  };
}

function approvalFor(
  id: RecoveryId,
  scenario: BaselineScenario,
  result: ScenarioEvaluation,
  deltaInr: number | null
): ApprovalFacts {
  const replacement = scenario.steps.filter((step) => step.type === "dispatch")[1];
  const store = scenario.steps.find((step) => step.type === "store");
  const facility = store
    ? baseline.storageFacilities.find(
        (item) => item.id === String(store.facilityId)
      )
    : undefined;
  const vehicle = replacement
    ? `${Number(replacement.count)} × ${vehicleById(String(replacement.vehicleId)).name}`
    : vehicleById("standard-10t").name;
  const storage = store
    ? `${nodeLabel(facility?.nodeId ?? "nashik-cold")} · ${Number(store.holdingHours)} h hold`
    : "No additional storage";
  return {
    title:
      id === "alternative-recovery"
        ? "Transfer, store, then deliver to Pune"
        : id === "vehicle-breakdown"
          ? "Repair, then continue to Vashi"
          : id === "no-action"
            ? "Wait for the included repair, then continue to Vashi"
            : "Transfer by reefer fleet to Pune",
    transferAt: "Nashik checkpoint",
    vehicle,
    storage,
    destination: marketName(scenario.marketId),
    interventionInr: result.interventionCostInr,
    netInr: result.netProceedsInr,
    deltaInr,
    journeyNote:
      scenario.description ??
      "The modeled journey includes every recorded step through unloading.",
  };
}

function comparisonMap(id: RecoveryId): { points: MapPoint[]; lines: MapLine[] } {
  const selected = pointIdsForEdges(travelEdgeIds(scenarioById(id)));
  const noAction = pointIdsForEdges(travelEdgeIds(scenarioById("no-action")));
  const split = (ids: string[]) => {
    const index = ids.indexOf("nashik");
    return index === -1 ? ids : ids.slice(index);
  };
  const pointIds = [...new Set([...selected, ...noAction])];
  const destination = selected[selected.length - 1];
  return {
    points: pointIds.map((pointId) =>
      toMapPoint(
        pointId,
        pointId === "nashik"
          ? "incident"
          : pointId === destination
            ? "destination"
            : pointId === selected[0]
              ? "origin"
              : "checkpoint"
      )
    ),
    lines: [
      {
        id: "traveled",
        label: "Completed leg",
        style: "solid",
        tone: "green",
        pointIds: selected.slice(0, selected.indexOf("nashik") + 1),
      },
      {
        id: "recovery",
        label: `Recovery → ${nodeLabel(destination)}`,
        style: "solid",
        tone: "green",
        pointIds: split(selected),
      },
      {
        id: "no-action",
        label: "No action → Vashi",
        style: "dashed",
        tone: "red",
        pointIds: split(noAction),
      },
    ],
  };
}

let recoveryCache: RecoveryView[] | null = null;

export function recoveryViews(): RecoveryView[] {
  if (recoveryCache) return recoveryCache;
  const results = evaluateAll(baseline);
  const views = RECOVERY_IDS.map((id) => {
    const scenario = scenarioById(id);
    const result = results.find((item) => item.id === id);
    if (!result) throw new Error(`Missing evaluation for ${id}`);
    const copy = recoveryCopy(id, scenario);
    const timeline = timelineFor(result);
    const delta =
      id === "no-action" ? null : (result.incrementalNetInr ?? null);
    const map = comparisonMap(id);
    const view: RecoveryView = {
      id,
      title: copy.title,
      eyebrow: copy.eyebrow,
      summary: copy.summary,
      description: scenario.description ?? "",
      destination: marketName(scenario.marketId),
      grade: result.grade,
      completionHours: result.completionHours,
      arrivalHours: result.arrivalHours,
      waitingHours: result.waitingHours,
      onwardHours: timeline.onwardHours,
      netProceedsInr: result.netProceedsInr,
      grossProceedsInr: result.grossProceedsInr,
      totalCostsInr: result.totalCostsInr,
      saleableKg: result.saleableKg,
      qualityFraction: result.qualityFraction,
      interventionCostInr: result.interventionCostInr,
      deltaInr: delta,
      recommended: false,
      tone: copy.tone,
      timeline: timeline.entries,
      costRows: costRowsOf(result),
      points: map.points,
      lines: map.lines,
      approval: approvalFor(id, scenario, result, delta),
    };
    return view;
  });
  const candidates = views.filter(
    (view) => view.deltaInr != null && view.deltaInr > 0
  );
  const best = [...candidates].sort(
    (a, b) => (b.deltaInr ?? 0) - (a.deltaInr ?? 0)
  )[0];
  if (best) {
    best.recommended = true;
    best.tone = "recommended";
    best.eyebrow = "Recommended in this demo";
  }
  recoveryCache = views;
  return views;
}

export function recoveryById(id: RecoveryId): RecoveryView {
  const view = recoveryViews().find((item) => item.id === id);
  if (!view) throw new Error(`Unknown recovery ${id}`);
  return view;
}

export function comparisonFor(mode: string): {
  mode: "recovery" | "repair" | "negative" | "equal";
  illustrative: boolean;
  recovery: RecoveryView;
  baseline: RecoveryView;
  deltaInr: number;
  note: string;
} {
  const noAction = recoveryById("no-action");
  if (mode === "negative") {
    const recovery = recoveryById("negative-recovery");
    return {
      mode: "negative",
      illustrative: false,
      recovery,
      baseline: noAction,
      deltaInr: recovery.deltaInr ?? 0,
      note: "Same initial lot and breakdown. This intervention is worse than waiting for the included repair.",
    };
  }
  if (mode === "repair") {
    const recovery = recoveryById("vehicle-breakdown");
    return {
      mode: "repair",
      illustrative: false,
      recovery,
      baseline: noAction,
      deltaInr: recovery.deltaInr ?? 0,
      note: "Same initial lot and breakdown. Paid repair is a modeled alternative, not the recommended storage transfer.",
    };
  }
  if (mode === "equal") {
    return {
      mode: "equal",
      illustrative: true,
      recovery: noAction,
      baseline: noAction,
      deltaInr: 0,
      note: "Illustrative only. No canonical fixture produces an equal outcome. Both columns repeat the no-action result so the illustrated difference is zero.",
    };
  }
  const recovery = recoveryById("alternative-recovery");
  return {
    mode: "recovery",
    illustrative: false,
    recovery,
    baseline: noAction,
    deltaInr: recovery.deltaInr ?? 0,
    note: "Same initial lot and breakdown. Synthetic estimates, not a guaranteed gain.",
  };
}

export interface CheckpointStop {
  id: string;
  label: string;
  atHours: number;
}

export function routeStops(routeId: string): {
  stops: CheckpointStop[];
  distanceKm: number;
  transitHours: number;
} {
  const route = baseline.routes.find((item) => item.id === routeId);
  if (!route) throw new Error(`Unknown route ${routeId}`);
  let atHours = 0;
  let distanceKm = 0;
  const stops: CheckpointStop[] = [
    {
      id: baseline.crop.originNodeId,
      label: nodeLabel(baseline.crop.originNodeId),
      atHours: 0,
    },
  ];
  for (const edgeId of route.edgeIds) {
    const edge = edgeById(edgeId);
    atHours += edge.durationHours;
    distanceKm += edge.distanceKm;
    stops.push({
      id: edge.to,
      label: nodeLabel(edge.to),
      atHours,
    });
  }
  return { stops, distanceKm, transitHours: atHours };
}

export function trackingCheckpoints(
  marketId: MarketId,
  quantityKg = baseline.crop.quantityKg
) {
  const plan = planByMarket(marketId, quantityKg);
  if (!plan) return null;
  const schedule = routeStops(plan.routeId);
  const map = routeMap(plan.pointIds, marketId);
  return { plan, ...schedule, ...map };
}

export function csvDocument(rows: string[][]): string {
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}

export function journeyReportText(view: RecoveryView, baselineView: RecoveryView): string {
  const lines = [
    `KhetSe shipment report ${CANONICAL_SHIPMENT_ID}`,
    "SIMULATED. Modeled estimates, not realized income.",
    `Scenario: ${view.title}`,
    `Destination: ${view.destination}`,
    `Completion hours: ${view.completionHours}`,
    `Arrival grade: ${view.grade}`,
    `Saleable mass kg: ${view.saleableKg}`,
    `Gross proceeds INR: ${view.grossProceedsInr}`,
    `Total costs INR: ${view.totalCostsInr}`,
    `Net proceeds INR: ${view.netProceedsInr}`,
    `No-action net proceeds INR: ${baselineView.netProceedsInr}`,
    `Difference INR: ${(view.netProceedsInr - baselineView.netProceedsInr).toFixed(2)}`,
    "Cost breakdown:",
    ...view.costRows.map(
      (row) => `${row.label}: ${row.amountInr.toFixed(2)}`
    ),
  ];
  return lines.join("\n");
}

export function eventHistoryCsv(view: RecoveryView): string {
  return csvDocument([
    ["Elapsed hours", "Event", "Detail"],
    ...view.timeline.map((entry) => [
      String(entry.atHours),
      entry.title,
      entry.detail,
    ]),
    ["Disclosure", "SIMULATED", "Checkpoint times are baseline scenario results."],
  ]);
}

export function costBreakdownCsv(view: RecoveryView): string {
  return csvDocument([
    ["Item", "Amount INR"],
    ...view.costRows.map((row) => [row.label, row.amountInr.toFixed(2)]),
    ["Total", view.totalCostsInr.toFixed(2)],
    ["Gross proceeds", view.grossProceedsInr.toFixed(2)],
    ["Net proceeds", view.netProceedsInr.toFixed(2)],
    ["Disclosure", "SIMULATED modeled estimates"],
  ]);
}
