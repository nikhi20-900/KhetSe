import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  assertStorageCapacity,
  assertVehicleCapacity,
  byId,
  evaluateAll,
  loadBaseline,
  loadEvidence,
  qualityAt,
  routeTotals,
} from "./reference-model.mjs";

const nonnegative = (value, name) =>
  assert(
    typeof value === "number" && Number.isFinite(value) && value >= 0,
    `${name} must be finite and non-negative`
  );
const positive = (value, name) => {
  nonnegative(value, name);
  assert(value > 0, `${name} must be positive`);
};
const fraction = (value, name) => {
  nonnegative(value, name);
  assert(value <= 1, `${name} must be <= 1`);
};
const count = (value, name) => {
  positive(value, name);
  assert(Number.isInteger(value), `${name} must be an integer`);
};
const unique = (rows, name) => {
  assert(Array.isArray(rows) && rows.length, `${name} must not be empty`);
  assert(
    rows.every((row) => typeof row.id === "string" && row.id.length),
    `${name} requires IDs`
  );
  assert.equal(
    new Set(rows.map((row) => row.id)).size,
    rows.length,
    `Duplicate IDs in ${name}`
  );
};
const validDate = (date) =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

export function validateDemo(data, evidence) {
  unique(evidence, "evidence");
  for (const record of evidence) {
    assert(
      ["SIMULATED", "REQUIREMENT", "REFERENCE_ONLY"].includes(
        record.classification
      ),
      `Invalid evidence classification ${record.id}`
    );
    assert(
      validDate(record.retrievedOn),
      `Invalid retrieval date ${record.id}`
    );
    assert(
      record.sourceDate === null || validDate(record.sourceDate),
      `Invalid source date ${record.id}`
    );
    for (const key of ["sourceName", "claim", "methodology"])
      assert(record[key]?.trim(), `Missing ${key}: ${record.id}`);
    for (const key of ["units", "appliesTo"])
      assert(
        Array.isArray(record[key]) && record[key].length,
        `Missing ${key}: ${record.id}`
      );
    if (record.classification !== "SIMULATED")
      assert.equal(
        new URL(record.url).protocol,
        "https:",
        `Missing source URL ${record.id}`
      );
  }
  const provenance = (record) => {
    assert.equal(
      record.status,
      "SIMULATED",
      `Missing SIMULATED status: ${record.id ?? "root"}`
    );
    assert.equal(
      byId(evidence, record.evidenceId).classification,
      "SIMULATED",
      `Numeric data requires simulated provenance: ${record.id}`
    );
    for (const id of record.contextEvidenceIds ?? []) byId(evidence, id);
  };
  provenance(data);
  assert.equal(data.schemaVersion, "1.0.0");
  assert.deepEqual(
    data.units,
    {
      mass: "kg",
      displayMass: "MT",
      kgPerMt: 1000,
      volume: "m3",
      currency: "INR",
      distance: "km",
      duration: "hours",
      temperature: "°C",
      coordinates: "decimal degrees (WGS84)",
      quality: "fraction [0,1]",
      humidity: "% RH",
      price: "INR/kg",
      distanceRate: "INR/km",
      holdingRate: "INR/(kg*hour)",
      detentionRate: "INR/(vehicle*hour)",
      throughput: "kg/hour",
    },
    "Unit contract changed; migrate consumers explicitly"
  );
  provenance(data.clock);
  assert.equal(data.clock.timeZone, "Asia/Kolkata");
  for (const key of ["dispatchAt", "harvestWindowStart", "harvestWindowEnd"]) {
    assert(
      /T\d{2}:\d{2}:\d{2}\+05:30$/.test(data.clock[key]) &&
        Number.isFinite(Date.parse(data.clock[key])),
      `Invalid timestamp ${key}`
    );
  }
  assert(
    Date.parse(data.clock.harvestWindowStart) <=
      Date.parse(data.clock.harvestWindowEnd),
    "Reversed harvest window"
  );
  assert(
    Date.parse(data.clock.harvestWindowEnd) < Date.parse(data.clock.dispatchAt),
    "Harvest must precede dispatch"
  );
  provenance(data.crop);
  for (const key of [
    "quantityKg",
    "bulkDensityKgPerM3",
    "referenceShelfLifeHours",
  ])
    positive(data.crop[key], key);
  const curve = data.crop.qualityCurve;
  assert(
    Array.isArray(curve) && curve.length >= 2,
    "Curve requires at least two points"
  );
  assert.equal(curve[0].effectiveAgeHours, 0);
  assert(
    curve.at(-1).effectiveAgeHours >= data.crop.referenceShelfLifeHours,
    "Curve must cover the market acceptance horizon"
  );
  assert.equal(curve.at(-1).qualityFraction, 0);
  assert.equal(curve.at(-1).saleableFraction, 0);
  curve.forEach((point, index) => {
    nonnegative(point.effectiveAgeHours, "effectiveAgeHours");
    fraction(point.qualityFraction, "qualityFraction");
    fraction(point.saleableFraction, "saleableFraction");
    if (index) {
      assert(
        point.effectiveAgeHours > curve[index - 1].effectiveAgeHours,
        "Curve ages must increase"
      );
      assert(
        point.qualityFraction <= curve[index - 1].qualityFraction &&
          point.saleableFraction <= curve[index - 1].saleableFraction,
        "Decay cannot improve quality"
      );
    }
  });
  unique(data.crop.grades, "grades");
  data.crop.grades.forEach((grade, index, grades) => {
    fraction(grade.minimumQualityFraction, "grade threshold");
    fraction(grade.priceMultiplier, "grade multiplier");
    if (index) {
      assert(
        grade.minimumQualityFraction < grades[index - 1].minimumQualityFraction,
        "Grade thresholds must descend"
      );
      assert(
        grade.priceMultiplier <= grades[index - 1].priceMultiplier,
        "Grade price multipliers must descend"
      );
    }
  });
  assert.equal(data.crop.grades.at(-1).minimumQualityFraction, 0);
  assert.equal(data.crop.grades.at(-1).priceMultiplier, 0);
  assert.equal(qualityAt(data, 0).grade, data.crop.initialGrade);
  const lowestAcceptedGrade = data.crop.grades.findLast(
    (grade) => grade.priceMultiplier > 0
  );
  assert(lowestAcceptedGrade, "At least one saleable grade required");
  assert.equal(
    qualityAt(data, data.crop.referenceShelfLifeHours).qualityFraction,
    lowestAcceptedGrade.minimumQualityFraction,
    "Shelf life must end at the market acceptance threshold"
  );
  for (const key of [
    "environments",
    "nodes",
    "edges",
    "routes",
    "vehicles",
    "markets",
    "storageFacilities",
    "scenarios",
  ]) {
    unique(data[key], key);
    data[key].forEach(provenance);
  }
  for (const environment of data.environments) {
    assert(
      Number.isFinite(environment.temperatureC) &&
        environment.temperatureC >= -273.15,
      "Invalid temperature"
    );
    nonnegative(environment.relativeHumidityPct, "relativeHumidityPct");
    assert(environment.relativeHumidityPct <= 100, "Invalid humidity");
    positive(environment.ageMultiplier, "ageMultiplier");
  }
  byId(data.environments, "ambient");
  for (const node of data.nodes) {
    assert(
      Number.isFinite(node.latitudeDeg) && Math.abs(node.latitudeDeg) <= 90,
      `Invalid latitude: ${node.id}`
    );
    assert(
      Number.isFinite(node.longitudeDeg) && Math.abs(node.longitudeDeg) <= 180,
      `Invalid longitude: ${node.id}`
    );
  }
  byId(data.nodes, data.crop.originNodeId);
  const directedPairs = new Set();
  for (const edge of data.edges) {
    byId(data.nodes, edge.from);
    byId(data.nodes, edge.to);
    assert.notEqual(edge.from, edge.to, "Self edge is not permitted");
    const pair = `${edge.from}/${edge.to}`;
    assert(!directedPairs.has(pair), "Duplicate directed edge");
    directedPairs.add(pair);
    positive(edge.distanceKm, "distanceKm");
    nonnegative(edge.durationHours, "durationHours");
  }
  for (const route of data.routes) {
    const totals = routeTotals(data, route.edgeIds);
    assert(
      data.markets.some((market) => market.nodeId === totals.nodeId),
      `Route must end at a market: ${route.id}`
    );
  }
  for (const vehicle of data.vehicles) {
    for (const key of ["capacityKg", "capacityM3"]) positive(vehicle[key], key);
    count(vehicle.availableCount, "availableCount");
    for (const key of [
      "fixedDispatchInr",
      "rateInrPerKm",
      "loadingInrPerKg",
      "transferHours",
    ])
      nonnegative(vehicle[key], key);
    byId(data.environments, vehicle.environmentId);
    assert(vehicle.handling?.trim(), "Vehicle handling notes required");
  }
  assert.equal(
    data.markets.filter((market) => market.role === "primary").length,
    1,
    "Exactly one primary market required"
  );
  for (const market of data.markets) {
    byId(data.nodes, market.nodeId);
    assert(["primary", "secondary"].includes(market.role));
    positive(market.priceInrPerKg, "priceInrPerKg");
    positive(market.unloadingHours, "unloadingHours");
    count(market.parallelVehicleCapacity, "parallelVehicleCapacity");
    fraction(market.marketFeeFraction, "marketFeeFraction");
    for (const key of [
      "freeWaitingHours",
      "detentionInrPerVehicleHour",
      "unloadingInrPerKg",
    ])
      nonnegative(market[key], key);
    assert(
      Array.isArray(market.unloadingSlotsLocalHours) &&
        market.unloadingSlotsLocalHours.length,
      "Missing unloading slots"
    );
    let previousClose = 0;
    for (const slot of market.unloadingSlotsLocalHours) {
      assert(Array.isArray(slot) && slot.length === 2, "Invalid slot");
      const [open, close] = slot;
      nonnegative(open, "slot open");
      nonnegative(close, "slot close");
      assert(
        open >= previousClose &&
          close <= 24 &&
          close - open >= market.unloadingHours,
        "Invalid or overlapping unloading slot"
      );
      previousClose = close;
    }
  }
  for (const facility of data.storageFacilities) {
    byId(data.nodes, facility.nodeId);
    byId(data.environments, facility.environmentId);
    for (const key of ["capacityKg", "maxIntakeKg", "intakeKgPerHour"])
      positive(facility[key], key);
    for (const key of [
      "availableCapacityKg",
      "releaseHours",
      "holdingInrPerKgHour",
      "intakeInrPerKg",
      "releaseInrPerKg",
    ])
      nonnegative(facility[key], key);
    assert(
      facility.availableCapacityKg <= facility.capacityKg &&
        facility.maxIntakeKg <= facility.capacityKg,
      "Invalid storage capacity"
    );
    assert(facility.handling?.trim(), "Storage handling notes required");
  }
  for (const scenario of data.scenarios) {
    assert(
      scenario.steps?.length && scenario.steps[0].type === "dispatch",
      "Scenario must begin with dispatch"
    );
    if (scenario.comparisonScenarioId) {
      const baseline = byId(data.scenarios, scenario.comparisonScenarioId);
      assert.equal(scenario.comparisonScenarioId, "no-action");
      assert.equal(
        scenario.decisionNodeId,
        baseline.decisionNodeId,
        "Recovery must compare at the same decision node"
      );
      assert.deepEqual(
        scenario.steps.slice(0, 2),
        baseline.steps.slice(0, 2),
        "Recovery must share the sunk-cost prefix"
      );
      assert.equal(
        byId(data.edges, scenario.steps[1].edgeId).to,
        scenario.decisionNodeId
      );
    }
    for (const step of scenario.steps) {
      if (step.type === "dispatch") {
        assertVehicleCapacity(
          data,
          byId(data.vehicles, step.vehicleId),
          step.count
        );
        nonnegative(step.surchargeInr, "surchargeInr");
      } else if (step.type === "pause") {
        nonnegative(step.durationHours, "durationHours");
        nonnegative(step.costInr, "costInr");
        byId(data.environments, step.environmentId);
      } else if (step.type === "store") {
        nonnegative(step.holdingHours, "holdingHours");
        assertStorageCapacity(
          data,
          byId(data.storageFacilities, step.facilityId)
        );
      } else if (step.type === "travel") byId(data.edges, step.edgeId);
      else throw new Error(`Unknown step type: ${step.type}`);
    }
  }
  const results = evaluateAll(data);
  for (const result of results) {
    for (const key of [
      "completionHours",
      "distanceKm",
      "effectiveAgeHours",
      "saleableKg",
      "grossProceedsInr",
      "totalCostsInr",
    ])
      nonnegative(result[key], key);
    assert(
      Number.isFinite(result.netProceedsInr),
      "Net proceeds must be finite; losses are allowed"
    );
    assert(
      result.saleableKg <= data.crop.quantityKg,
      "Saleable quantity cannot exceed harvested quantity"
    );
  }
  assert(
    byId(results, "alternative-recovery").incrementalNetInr > 0,
    "Recovery fixture must improve on no action"
  );
  const negative = byId(results, "negative-recovery");
  assert(
    negative.interventionCostInr > negative.grossProceedsInr,
    "Negative fixture must cost more than all salvage proceeds"
  );
  assert(negative.incrementalNetInr < 0, "Negative recovery must be rejected");
  return results;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const results = validateDemo(await loadBaseline(), await loadEvidence());
  console.log(
    `Validated units, provenance, capacities, coordinates, directed routes and ${results.length} SIMULATED scenarios.`
  );
}
