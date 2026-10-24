// A deterministic fixture calculator for issue #1, not a production simulator.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export async function loadBaseline() {
  return JSON.parse(
    await readFile(
      new URL("../data/demo-baseline.json", import.meta.url),
      "utf8"
    )
  );
}

export async function loadEvidence() {
  return JSON.parse(
    await readFile(
      new URL("../data/evidence-register.json", import.meta.url),
      "utf8"
    )
  );
}

export function byId(rows, id) {
  const row = rows.find((entry) => entry.id === id);
  assert(row, `Unknown reference: ${id}`);
  return row;
}

export function routeTotals(
  data,
  edgeIds,
  startNodeId = data.crop.originNodeId
) {
  let nodeId = startNodeId;
  let distanceKm = 0;
  let durationHours = 0;
  assert(edgeIds.length > 0, "Route must contain an edge");
  for (const id of edgeIds) {
    const edge = byId(data.edges, id);
    assert.equal(edge.from, nodeId, `Disconnected route at ${id}`);
    distanceKm += edge.distanceKm;
    durationHours += edge.durationHours;
    nodeId = edge.to;
  }
  return { nodeId, distanceKm, durationHours };
}

export function qualityAt(data, effectiveAgeHours) {
  assert(
    Number.isFinite(effectiveAgeHours) && effectiveAgeHours >= 0,
    "Invalid effective age"
  );
  const points = data.crop.qualityCurve;
  let sample = points.at(-1);
  for (let index = 1; index < points.length; index++) {
    const left = points[index - 1];
    const right = points[index];
    if (effectiveAgeHours <= right.effectiveAgeHours) {
      const fraction =
        (effectiveAgeHours - left.effectiveAgeHours) /
        (right.effectiveAgeHours - left.effectiveAgeHours);
      sample = {
        qualityFraction:
          left.qualityFraction +
          fraction * (right.qualityFraction - left.qualityFraction),
        saleableFraction:
          left.saleableFraction +
          fraction * (right.saleableFraction - left.saleableFraction),
      };
      break;
    }
  }
  const grade = data.crop.grades.find(
    (entry) => sample.qualityFraction >= entry.minimumQualityFraction
  );
  assert(grade, "No matching grade");
  return {
    qualityFraction: sample.qualityFraction,
    saleableFraction: grade.priceMultiplier === 0 ? 0 : sample.saleableFraction,
    grade: grade.id,
    priceMultiplier: grade.priceMultiplier,
    referenceShelfLifeRemainingHours: Math.max(
      0,
      data.crop.referenceShelfLifeHours - effectiveAgeHours
    ),
  };
}

export function dispatchLocalHour(data) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: data.clock.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(data.clock.dispatchAt));
  const value = (type) =>
    Number(parts.find((part) => part.type === type).value);
  return value("hour") + value("minute") / 60 + value("second") / 3600;
}

export function unloadingWaitHours(market, arrivalLocalHours) {
  assert(
    Number.isFinite(arrivalLocalHours) && arrivalLocalHours >= 0,
    "Invalid arrival time"
  );
  const firstDay = Math.floor(arrivalLocalHours / 24);
  for (let day = firstDay; day <= firstDay + 1; day++) {
    for (const [open, close] of market.unloadingSlotsLocalHours) {
      const start = Math.max(arrivalLocalHours, day * 24 + open);
      // Completion at close is allowed; beginning at close is not.
      if (start + market.unloadingHours <= day * 24 + close)
        return start - arrivalLocalHours;
    }
  }
  throw new Error(`No feasible unloading slot at ${market.id}`);
}

export function assertVehicleCapacity(data, vehicle, count) {
  assert(
    Number.isInteger(count) && count > 0 && count <= vehicle.availableCount,
    `Invalid fleet count: ${vehicle.id}`
  );
  assert(
    data.crop.quantityKg <= vehicle.capacityKg * count,
    `Weight capacity exceeded: ${vehicle.id}`
  );
  assert(
    data.crop.quantityKg / data.crop.bulkDensityKgPerM3 <=
      vehicle.capacityM3 * count,
    `Volume capacity exceeded: ${vehicle.id}`
  );
}

export function assertStorageCapacity(data, facility) {
  assert(
    data.crop.quantityKg <= facility.availableCapacityKg,
    `Available storage capacity exceeded: ${facility.id}`
  );
  assert(
    data.crop.quantityKg <= facility.maxIntakeKg,
    `Storage intake capacity exceeded: ${facility.id}`
  );
}

const round = (value, digits = 2) => Number(value.toFixed(digits));

function startScenario(data) {
  return {
    nodeId: data.crop.originNodeId,
    vehicle: undefined,
    vehicleCount: 0,
    replacementVehicle: false,
    elapsedHours: 0,
    effectiveAgeHours: 0,
    distanceKm: 0,
    interventionCostInr: 0,
    allocations: new Map(),
    costs: {
      dispatch: 0,
      transport: 0,
      loading: 0,
      intervention: 0,
      storage: 0,
      detention: 0,
      unloading: 0,
      marketFees: 0,
    },
  };
}

function applyScenarioStep(data, scenario, state, step) {
  const advance = (hours, environmentId) => {
    assert(Number.isFinite(hours) && hours >= 0, "Invalid step duration");
    state.elapsedHours += hours;
    state.effectiveAgeHours +=
      hours * byId(data.environments, environmentId).ageMultiplier;
  };
  const charge = (bucket, amount, intervention = false) => {
    assert(Number.isFinite(amount) && amount >= 0, "Invalid cost");
    state.costs[bucket] += amount;
    if (intervention) state.interventionCostInr += amount;
  };
  if (step.type === "dispatch") {
    state.replacementVehicle = Boolean(state.vehicle);
    state.vehicle = byId(data.vehicles, step.vehicleId);
    state.vehicleCount = step.count;
    assertVehicleCapacity(data, state.vehicle, state.vehicleCount);
    state.allocations.set(
      state.vehicle.id,
      (state.allocations.get(state.vehicle.id) ?? 0) + state.vehicleCount
    );
    assert(
      state.allocations.get(state.vehicle.id) <= state.vehicle.availableCount,
      `Fleet availability exceeded: ${state.vehicle.id}`
    );
    if (state.replacementVehicle)
      advance(state.vehicle.transferHours, "ambient");
    charge(
      "dispatch",
      state.vehicle.fixedDispatchInr * state.vehicleCount,
      state.replacementVehicle
    );
    charge(
      "loading",
      state.vehicle.loadingInrPerKg * data.crop.quantityKg,
      state.replacementVehicle
    );
    charge("intervention", step.surchargeInr, true);
    return;
  }
  if (step.type === "travel") {
    assert(state.vehicle, "Travel requires a dispatched vehicle");
    const edge = byId(data.edges, step.edgeId);
    assert.equal(
      edge.from,
      state.nodeId,
      `Disconnected scenario ${scenario.id}: ${edge.id}`
    );
    advance(edge.durationHours, state.vehicle.environmentId);
    charge(
      "transport",
      edge.distanceKm * state.vehicle.rateInrPerKm * state.vehicleCount,
      state.replacementVehicle
    );
    state.distanceKm += edge.distanceKm;
    state.nodeId = edge.to;
    return;
  }
  if (step.type === "pause") {
    assert(state.vehicle, "Pause requires a dispatched vehicle");
    advance(step.durationHours, step.environmentId);
    charge("intervention", step.costInr, true);
    return;
  }
  if (step.type === "store") {
    assert(state.vehicle, "Storage requires a dispatched vehicle");
    const facility = byId(data.storageFacilities, step.facilityId);
    assert.equal(
      state.nodeId,
      facility.nodeId,
      "Storage facility is not at the current node"
    );
    assertStorageCapacity(data, facility);
    advance(data.crop.quantityKg / facility.intakeKgPerHour, "ambient");
    advance(step.holdingHours, facility.environmentId);
    advance(facility.releaseHours, "ambient");
    charge(
      "storage",
      data.crop.quantityKg *
        (facility.intakeInrPerKg +
          facility.releaseInrPerKg +
          step.holdingHours * facility.holdingInrPerKgHour),
      true
    );
    return;
  }
  throw new Error(`Unknown step type: ${step.type}`);
}

function settledResult(data, scenario, state) {
  const market = byId(data.markets, scenario.marketId);
  assert(state.vehicle, "Scenario requires a vehicle");
  assert.equal(
    state.nodeId,
    market.nodeId,
    `Scenario ${scenario.id} ends at the wrong market`
  );
  assert(
    state.vehicleCount <= market.parallelVehicleCapacity,
    "Insufficient parallel unloading capacity"
  );
  const arrivalHours = state.elapsedHours;
  const waitingHours = unloadingWaitHours(
    market,
    dispatchLocalHour(data) + arrivalHours
  );
  const advance = (hours, environmentId) => {
    assert(Number.isFinite(hours) && hours >= 0, "Invalid step duration");
    state.elapsedHours += hours;
    state.effectiveAgeHours +=
      hours * byId(data.environments, environmentId).ageMultiplier;
  };
  const charge = (bucket, amount) => {
    assert(Number.isFinite(amount) && amount >= 0, "Invalid cost");
    state.costs[bucket] += amount;
  };
  advance(waitingHours, state.vehicle.environmentId);
  advance(market.unloadingHours, "ambient");
  charge(
    "detention",
    Math.max(0, waitingHours - market.freeWaitingHours) *
      market.detentionInrPerVehicleHour *
      state.vehicleCount
  );
  charge("unloading", data.crop.quantityKg * market.unloadingInrPerKg);
  const quality = qualityAt(data, state.effectiveAgeHours);
  const saleableKg = data.crop.quantityKg * quality.saleableFraction;
  const grossProceedsInr =
    saleableKg * market.priceInrPerKg * quality.priceMultiplier;
  charge("marketFees", grossProceedsInr * market.marketFeeFraction);
  const totalCostsInr = Object.values(state.costs).reduce(
    (sum, cost) => sum + cost,
    0
  );
  return {
    id: scenario.id,
    status: "SIMULATED",
    marketId: market.id,
    distanceKm: state.distanceKm,
    arrivalHours,
    waitingHours,
    completionHours: state.elapsedHours,
    effectiveAgeHours: round(state.effectiveAgeHours, 6),
    grade: quality.grade,
    qualityFraction: round(quality.qualityFraction, 6),
    saleableKg: round(saleableKg, 3),
    referenceShelfLifeRemainingHours: round(
      quality.referenceShelfLifeRemainingHours,
      6
    ),
    grossProceedsInr: round(grossProceedsInr),
    totalCostsInr: round(totalCostsInr),
    netProceedsInr: round(grossProceedsInr - totalCostsInr),
    interventionCostInr: round(state.interventionCostInr),
    costBreakdownInr: Object.fromEntries(
      Object.entries(state.costs).map(([key, value]) => [key, round(value)])
    ),
  };
}

export function evaluateScenario(data, scenario) {
  const state = startScenario(data);
  for (const step of scenario.steps) {
    applyScenarioStep(data, scenario, state, step);
  }
  return settledResult(data, scenario, state);
}

/** Cost of the opening steps before market settlement. Same rules as evaluateScenario. */
export function prefixCostInr(data, scenario, stepCount) {
  assert(
    Number.isInteger(stepCount) &&
      stepCount >= 0 &&
      stepCount <= scenario.steps.length,
    "Invalid prefix length"
  );
  const state = startScenario(data);
  for (const step of scenario.steps.slice(0, stepCount)) {
    applyScenarioStep(data, scenario, state, step);
  }
  return round(Object.values(state.costs).reduce((sum, cost) => sum + cost, 0));
}

export function evaluateAll(data) {
  const results = data.scenarios.map((scenario) =>
    evaluateScenario(data, scenario)
  );
  return results.map((result) => {
    const scenario = byId(data.scenarios, result.id);
    if (!scenario.comparisonScenarioId) return result;
    const baseline = byId(results, scenario.comparisonScenarioId);
    const delta = round(result.netProceedsInr - baseline.netProceedsInr);
    return {
      ...result,
      comparisonScenarioId: baseline.id,
      incrementalNetInr: delta,
      recommendation:
        delta > 0 ? "BETTER_THAN_NO_ACTION" : "REJECT_INTERVENTION",
    };
  });
}
