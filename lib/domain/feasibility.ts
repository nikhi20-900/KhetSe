import simulationBaseline from "@/data/demo-baseline.json";
/**
 * Intake feasibility rules and plan ranking.
 *
 * These checks explain which demo-register routes can be booked from a harvest
 * intake. They are pure and deterministic. The virtual clock, disruption queue,
 * and bit-for-bit simulation remain in the simulation module.
 */

import type { HarvestIntake } from "@/lib/contracts/harvest.contract";
import {
  MODELED_ESTIMATE_LABEL,
  REJECTION_CATEGORIES,
  REJECTION_CODES,
  type ConstraintRejection,
  type FeasibleLogisticsPlan,
  type LogisticsPlanEvaluation,
  type ObjectiveLabel,
  type RejectedLogisticsPlan,
  type RejectionCode,
} from "@/lib/contracts/plan.contract";
import {
  AMBIENT_HANDLING_BAND_C,
  DEMO_CROP_TYPE,
  DEMO_ORIGIN,
  DEMO_ORIGIN_MATCH_RADIUS_KM,
  MARKETS,
  VEHICLES,
  type MarketDestination,
  type VehicleOption,
} from "@/lib/planning/catalog";
import { estimateDirectPlan } from "@/lib/planning/estimates";
import { formatHours, formatIst, formatKg } from "@/lib/planning/format";
import {
  nextReceivingWindowStart,
  scheduleReceivingWindow,
} from "@/lib/planning/schedule";

export interface PlanEvaluationContext {
  harvest: HarvestIntake;
  market: MarketDestination;
  vehicle: VehicleOption;
}

export interface FeasibilityRule {
  code: RejectionCode;
  category: string;
  evaluate(context: PlanEvaluationContext): ConstraintRejection | null;
}

export function temperatureBandsOverlap(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number
): boolean {
  return aMin <= bMax && bMin <= aMax;
}

export function distanceKm(
  latitude: number,
  longitude: number,
  originLatitude = DEMO_ORIGIN.latitude,
  originLongitude = DEMO_ORIGIN.longitude
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(originLatitude - latitude);
  const longitudeDelta = toRadians(originLongitude - longitude);
  const originLat = toRadians(latitude);
  const targetLat = toRadians(originLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLat) *
      Math.cos(targetLat) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function rejection(code: RejectionCode, message: string): ConstraintRejection {
  return {
    code,
    category: REJECTION_CATEGORIES[code],
    message,
  };
}

const capacityRule: FeasibilityRule = {
  code: REJECTION_CODES.CAPACITY_MISMATCH,
  category: REJECTION_CATEGORIES.CAPACITY_MISMATCH,
  evaluate(context) {
    if (context.harvest.quantityKg <= context.vehicle.payloadKg) {
      return null;
    }
    return rejection(
      REJECTION_CODES.CAPACITY_MISMATCH,
      `Harvest volume (${formatKg(context.harvest.quantityKg)}) exceeds the ${context.vehicle.name} payload (${formatKg(context.vehicle.payloadKg)}).`
    );
  },
};

const thermalRule: FeasibilityRule = {
  code: REJECTION_CODES.THERMAL_INCOMPATIBILITY,
  category: REJECTION_CATEGORIES.THERMAL_INCOMPATIBILITY,
  evaluate(context) {
    const declaredMin = context.harvest.temperatureRequirementC.min;
    const declaredMax = context.harvest.temperatureRequirementC.max;
    const declared = `${declaredMin}–${declaredMax}°C`;

    if (context.vehicle.thermal.kind === "reefer") {
      const { minC, maxC } = context.vehicle.thermal;
      if (temperatureBandsOverlap(declaredMin, declaredMax, minC, maxC)) {
        return null;
      }
      return rejection(
        REJECTION_CODES.THERMAL_INCOMPATIBILITY,
        `The declared band is ${declared}. ${context.vehicle.name} holds ${minC}–${maxC}°C. Those bands do not overlap.`
      );
    }

    if (
      temperatureBandsOverlap(
        declaredMin,
        declaredMax,
        AMBIENT_HANDLING_BAND_C.min,
        AMBIENT_HANDLING_BAND_C.max
      )
    ) {
      return null;
    }

    return rejection(
      REJECTION_CODES.THERMAL_INCOMPATIBILITY,
      `The declared band is ${declared}. ${context.vehicle.name} is checked against the registered ambient handling band of ${AMBIENT_HANDLING_BAND_C.min}–${AMBIENT_HANDLING_BAND_C.max}°C. Those bands do not overlap.`
    );
  },
};

const shelfLifeRule: FeasibilityRule = {
  code: REJECTION_CODES.SHELF_LIFE_EXPIRED,
  category: REJECTION_CATEGORIES.SHELF_LIFE_EXPIRED,
  evaluate(context) {
    if (context.market.transitHoursMax <= context.harvest.maxShelfLifeHours) {
      return null;
    }
    return rejection(
      REJECTION_CODES.SHELF_LIFE_EXPIRED,
      `The ${context.market.name} transit window is ${formatHours(context.market.transitHoursMin)}–${formatHours(context.market.transitHoursMax)} hours. The slow end is longer than the declared shelf-life of ${formatHours(context.harvest.maxShelfLifeHours)} hours.`
    );
  },
};

function windowExpiredMessage(
  harvest: HarvestIntake,
  market: MarketDestination
): string {
  const harvestTime = new Date(harvest.harvestTimestamp);
  const nextOpen = nextReceivingWindowStart(harvestTime, market.receivingStart);
  const when = nextOpen
    ? formatIst(nextOpen.toISOString())
    : `${market.receivingStart} IST`;
  return `The next ${market.name} receiving slot opens ${when} (${market.receivingStart}–${market.receivingEnd} IST). A drive of ${formatHours(market.transitHoursMax)} hours arrives outside the declared shelf-life of ${formatHours(harvest.maxShelfLifeHours)} hours.`;
}

const windowRule: FeasibilityRule = {
  code: REJECTION_CODES.WINDOW_EXPIRED,
  category: REJECTION_CATEGORIES.WINDOW_EXPIRED,
  evaluate(context) {
    if (context.market.transitHoursMax > context.harvest.maxShelfLifeHours) {
      return null;
    }
    const schedule = scheduleReceivingWindow({
      harvestTime: new Date(context.harvest.harvestTimestamp),
      transitHours: context.market.transitHoursMax,
      shelfLifeHours: context.harvest.maxShelfLifeHours,
      windowStart: context.market.receivingStart,
      windowEnd: context.market.receivingEnd,
    });
    if (schedule) {
      return null;
    }
    return rejection(
      REJECTION_CODES.WINDOW_EXPIRED,
      windowExpiredMessage(context.harvest, context.market)
    );
  },
};

export const FEASIBILITY_RULES: readonly FeasibilityRule[] = [
  capacityRule,
  thermalRule,
  shelfLifeRule,
  windowRule,
];

export function logisticsPlanId(marketId: string, vehicleId: string): string {
  return `plan_${marketId}_${vehicleId}`;
}

function vehicleForPlan(planId: string): VehicleOption | undefined {
  return VEHICLES.find((vehicle) => planId.endsWith(`_${vehicle.id}`));
}

export function compareByTransit(
  left: FeasibleLogisticsPlan,
  right: FeasibleLogisticsPlan
): number {
  if (left.transitDurationHoursMin !== right.transitDurationHoursMin) {
    return left.transitDurationHoursMin - right.transitDurationHoursMin;
  }
  if (left.transitDurationHoursMax !== right.transitDurationHoursMax) {
    return left.transitDurationHoursMax - right.transitDurationHoursMax;
  }
  const preference =
    (vehicleForPlan(left.planId)?.fastestPreference ?? 99) -
    (vehicleForPlan(right.planId)?.fastestPreference ?? 99);
  if (preference !== 0) {
    return preference;
  }
  return left.estimatedLogisticsCostInr - right.estimatedLogisticsCostInr;
}

export function compareByCost(
  left: FeasibleLogisticsPlan,
  right: FeasibleLogisticsPlan
): number {
  if (left.estimatedLogisticsCostInr !== right.estimatedLogisticsCostInr) {
    return left.estimatedLogisticsCostInr - right.estimatedLogisticsCostInr;
  }
  return right.expectedNetProceedsInr - left.expectedNetProceedsInr;
}

export function compareByNetProceeds(
  left: FeasibleLogisticsPlan,
  right: FeasibleLogisticsPlan
): number {
  if (left.expectedNetProceedsInr !== right.expectedNetProceedsInr) {
    return right.expectedNetProceedsInr - left.expectedNetProceedsInr;
  }
  return left.estimatedLogisticsCostInr - right.estimatedLogisticsCostInr;
}

function roundScore(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function blockedEvaluation(
  reason: ConstraintRejection
): LogisticsPlanEvaluation {
  return {
    estimateLabel: MODELED_ESTIMATE_LABEL,
    evaluatedCombinations: 0,
    feasiblePlans: [],
    rejectedPlans: [
      {
        planId: `plan_blocked_${reason.code.toLowerCase()}`,
        marketDestination: "Not evaluated",
        transportMode: "Not evaluated",
        feasibility: {
          isFeasible: false,
          rejectionReason: `${reason.code}: ${reason.message}`,
        },
        rejections: [reason],
      },
    ],
    featuredPlanIds: [],
    blockingReason: reason,
  };
}

function intakeBlock(harvest: HarvestIntake): ConstraintRejection | null {
  if (harvest.cropType.toLowerCase() !== DEMO_CROP_TYPE.toLowerCase()) {
    return rejection(
      REJECTION_CODES.CROP_OUTSIDE_REGISTER,
      `The demo register covers ${DEMO_CROP_TYPE} only. No market, vehicle, or price table is registered for ${harvest.cropType}.`
    );
  }

  const offsetKm = distanceKm(
    harvest.originLocation.latitude,
    harvest.originLocation.longitude
  );
  if (offsetKm > DEMO_ORIGIN_MATCH_RADIUS_KM) {
    return rejection(
      REJECTION_CODES.ORIGIN_OUTSIDE_REGISTER,
      `Distances and APMC prices are registered for ${DEMO_ORIGIN.name} (${DEMO_ORIGIN.latitude}° N, ${DEMO_ORIGIN.longitude}° E). ${harvest.originLocation.name} is ${formatKm(offsetKm)} away, past the ${DEMO_ORIGIN_MATCH_RADIUS_KM} km match used to identify that origin.`
    );
  }

  if (harvest.declaredQualityGrade !== "Grade A") {
    return rejection(
      REJECTION_CODES.PRICE_BENCHMARK_UNAVAILABLE,
      `Indicative APMC prices in the evidence register are published for Grade A only. ${harvest.declaredQualityGrade} has no benchmark price, so proceeds are not estimated.`
    );
  }

  return null;
}

function formatKm(kilometers: number): string {
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(kilometers)} km`;
}

function evaluateCandidate(
  harvest: HarvestIntake,
  market: MarketDestination,
  vehicle: VehicleOption
): FeasibleLogisticsPlan | RejectedLogisticsPlan {
  const context = { harvest, market, vehicle };
  const rejections = FEASIBILITY_RULES.map((rule) =>
    rule.evaluate(context)
  ).filter((item): item is ConstraintRejection => item !== null);
  const planId = logisticsPlanId(market.id, vehicle.id);

  if (rejections.length > 0) {
    const primary = rejections[0];
    return {
      planId,
      marketDestination: market.name,
      transportMode: vehicle.name,
      feasibility: {
        isFeasible: false,
        rejectionReason: `${primary.code}: ${primary.message}`,
      },
      rejections,
    };
  }

  const schedule = scheduleReceivingWindow({
    harvestTime: new Date(harvest.harvestTimestamp),
    transitHours: market.transitHoursMax,
    shelfLifeHours: harvest.maxShelfLifeHours,
    windowStart: market.receivingStart,
    windowEnd: market.receivingEnd,
  });

  if (!schedule) {
    const reason = rejection(
      REJECTION_CODES.WINDOW_EXPIRED,
      windowExpiredMessage(harvest, market)
    );
    return {
      planId,
      marketDestination: market.name,
      transportMode: vehicle.name,
      feasibility: {
        isFeasible: false,
        rejectionReason: `${reason.code}: ${reason.message}`,
      },
      rejections: [reason],
    };
  }

  const breakdown = estimateDirectPlan({
    quantityKg: harvest.quantityKg,
    market,
    vehicle,
    schedule,
  });

  return {
    planId,
    marketDestination: market.name,
    transportMode: vehicle.name,
    transitDurationHours: market.transitHoursMax,
    transitDurationHoursMin: market.transitHoursMin,
    transitDurationHoursMax: market.transitHoursMax,
    receivingWindow: `${market.receivingStart}–${market.receivingEnd} IST`,
    scheduledDeparture: schedule.departureIso,
    scheduledArrival: schedule.arrivalIso,
    estimatedLogisticsCostInr: breakdown.logisticsTotalInr,
    expectedGrossProceedsInr: breakdown.grossProceedsInr,
    expectedNetProceedsInr: breakdown.netProceedsInr,
    estimateLabel: MODELED_ESTIMATE_LABEL,
    objectiveLabels: [],
    feasibility: {
      isFeasible: true,
      score: roundScore(breakdown.saleableFraction),
      saleableFraction: breakdown.saleableFraction,
    },
    breakdown,
  };
}

function isFeasible(
  plan: FeasibleLogisticsPlan | RejectedLogisticsPlan
): plan is FeasibleLogisticsPlan {
  return plan.feasibility.isFeasible;
}

function assignHighlights(plans: FeasibleLogisticsPlan[]): {
  plans: FeasibleLogisticsPlan[];
  featuredPlanIds: string[];
} {
  if (plans.length === 0) {
    return { plans: [], featuredPlanIds: [] };
  }

  const fastest = [...plans].sort(compareByTransit)[0];
  const cheapest = [...plans].sort(compareByCost)[0];
  const richest = [...plans].sort(compareByNetProceeds)[0];
  const labels = new Map<string, ObjectiveLabel[]>();

  const addLabel = (planId: string, label: ObjectiveLabel) => {
    const current = labels.get(planId) ?? [];
    if (!current.includes(label)) {
      current.push(label);
    }
    labels.set(planId, current);
  };

  addLabel(fastest.planId, "Fastest Transit");
  addLabel(cheapest.planId, "Lowest Cost");
  addLabel(richest.planId, "Maximum Estimated Proceeds");

  const featuredPlanIds: string[] = [];
  for (const plan of [fastest, cheapest, richest]) {
    if (!featuredPlanIds.includes(plan.planId)) {
      featuredPlanIds.push(plan.planId);
    }
  }
  for (const plan of [...plans].sort(compareByNetProceeds)) {
    if (featuredPlanIds.length >= 3) {
      break;
    }
    if (!featuredPlanIds.includes(plan.planId)) {
      featuredPlanIds.push(plan.planId);
    }
  }

  const labeled = plans.map((plan) => ({
    ...plan,
    objectiveLabels: labels.get(plan.planId) ?? [],
  }));
  const featured = new Set(featuredPlanIds);
  const ordered = [
    ...featuredPlanIds.map((planId) =>
      labeled.find((plan) => plan.planId === planId)!
    ),
    ...labeled
      .filter((plan) => !featured.has(plan.planId))
      .sort(compareByNetProceeds),
  ];

  return { plans: ordered, featuredPlanIds };
}

export function evaluateLogisticsPlans(
  harvest: HarvestIntake
): LogisticsPlanEvaluation {
  const block = intakeBlock(harvest);
  if (block) {
    return blockedEvaluation(block);
  }

  const evaluated = MARKETS.flatMap((market) =>
    VEHICLES.map((vehicle) => evaluateCandidate(harvest, market, vehicle))
  );
  const feasible = evaluated.filter(isFeasible);
  const rejected = evaluated.filter(
    (plan): plan is RejectedLogisticsPlan => !plan.feasibility.isFeasible
  );
  const highlighted = assignHighlights(feasible);

  return {
    estimateLabel: MODELED_ESTIMATE_LABEL,
    evaluatedCombinations: evaluated.length,
    feasiblePlans: highlighted.plans,
    rejectedPlans: rejected,
    featuredPlanIds: highlighted.featuredPlanIds,
    blockingReason: null,
  };
}

export function findEvaluatedPlan(
  evaluation: LogisticsPlanEvaluation,
  planId: string
): FeasibleLogisticsPlan | RejectedLogisticsPlan | null {
  return (
    evaluation.feasiblePlans.find((plan) => plan.planId === planId) ??
    evaluation.rejectedPlans.find((plan) => plan.planId === planId) ??
    null
  );
}

/** Canonical SIM-001 fleet plans, independent of the legacy intake catalog. */
export interface SimulationPlan {
  routeId: string;
  vehicleId: string;
  vehicleCount: number;
  quantityKg: number;
}

export function evaluateSimulationPlan(plan: SimulationPlan) {
  const rejections: { code: string; message: string }[] = [];
  const route = simulationBaseline.routes.find(
    (item) => item.id === plan.routeId
  );
  const vehicle = simulationBaseline.vehicles.find(
    (item) => item.id === plan.vehicleId
  );
  if (!route)
    rejections.push({
      code: "UNKNOWN_ROUTE",
      message: "Choose a registered simulation route.",
    });
  if (!vehicle)
    rejections.push({
      code: "UNKNOWN_VEHICLE",
      message: "Choose a registered simulation vehicle.",
    });
  if (!Number.isFinite(plan.quantityKg) || plan.quantityKg <= 0)
    rejections.push({
      code: "INVALID_QUANTITY",
      message: "Quantity must be finite and positive.",
    });
  if (
    !Number.isInteger(plan.vehicleCount) ||
    plan.vehicleCount < 1 ||
    (vehicle && plan.vehicleCount > vehicle.availableCount)
  )
    rejections.push({
      code: "FLEET_UNAVAILABLE",
      message: "Requested fleet exceeds registered availability or is invalid.",
    });
  if (
    vehicle &&
    (plan.quantityKg > vehicle.capacityKg * plan.vehicleCount ||
      plan.quantityKg / simulationBaseline.crop.bulkDensityKgPerM3 >
        vehicle.capacityM3 * plan.vehicleCount)
  )
    rejections.push({
      code: "CAPACITY_MISMATCH",
      message: "The full lot must fit both fleet mass and volume capacity.",
    });
  return { isFeasible: rejections.length === 0, rejections };
}
