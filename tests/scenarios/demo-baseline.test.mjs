import assert from "node:assert/strict";
import { test } from "vitest";
import {
  assertStorageCapacity,
  assertVehicleCapacity,
  byId,
  evaluateAll,
  evaluateScenario,
  loadBaseline,
  loadEvidence,
  qualityAt,
  routeTotals,
  unloadingWaitHours,
} from "../../scripts/reference-model.mjs";
import { validateDemo } from "../../scripts/validate-demo.mjs";

const data = await loadBaseline();
const evidence = await loadEvidence();
const mutated = (edit) => {
  const copy = structuredClone(data);
  edit(copy);
  return copy;
};

test("canonical dataset meets all physical, provenance and comparison contracts", () => {
  assert.equal(validateDemo(data, evidence).length, 6);
  assert.equal(data.crop.quantityKg / data.units.kgPerMt, 10);
  assert.equal(data.crop.quantityKg / data.crop.bulkDensityKgPerM3, 20);
});

// Hand calculations of arrival/slot timing, piecewise interpolation and cost terms.
// These values are deliberately not generated from the reference calculator.
const expected = [
  ["normal-delivery", 6.5, 0, 8.5, 8.5, "A", 279008.33, 20580.17, 258428.17],
  ["vehicle-breakdown", 30.5, 0, 32.5, 56.5, "B", 210280, 23205.6, 187074.4],
  ["transit-delay", 16.5, 13.5, 32, 32, "B", 219520, 25640.4, 193879.6],
  [
    "alternative-recovery",
    19,
    13,
    34,
    25.05,
    "A",
    266945.63,
    37358.91,
    229586.71,
  ],
  ["no-action", 54.5, 0, 56.5, 104.5, "C", 102302.08, 17046.04, 85256.04],
  [
    "negative-recovery",
    8.5,
    0,
    10.5,
    6.65,
    "A",
    269251.88,
    388065.04,
    -118813.16,
  ],
];

for (const [
  id,
  arrival,
  wait,
  finish,
  age,
  grade,
  gross,
  costs,
  net,
] of expected) {
  test(`${id}: matches the independently calculated reference outcome`, () => {
    const result = evaluateScenario(data, byId(data.scenarios, id));
    assert.deepEqual(
      [
        result.arrivalHours,
        result.waitingHours,
        result.completionHours,
        result.effectiveAgeHours,
        result.grade,
        result.grossProceedsInr,
        result.totalCostsInr,
        result.netProceedsInr,
      ],
      [arrival, wait, finish, age, grade, gross, costs, net]
    );
  });
}

test("normal-delivery accounting can be reconstructed from physical units", () => {
  const saleableKg = 10000 * (1 - (0.01 * 8.5) / 24);
  const gross = saleableKg * 28;
  const net =
    gross - (2000 + 250 * 32 + 10000 * 0.2 + 10000 * 0.3 + gross * 0.02);
  assert.equal(Number(net.toFixed(2)), 258428.17);
});

test("directed routes have fixed independent totals and no implicit reverse", () => {
  for (const [id, km, hours] of [
    ["primary-vashi", 250, 6.5],
    ["secondary-pune", 260, 6.5],
    ["secondary-surat", 270, 6],
    ["storage-recovery-pune", 270, 7],
  ]) {
    const result = routeTotals(data, byId(data.routes, id).edgeIds);
    assert.equal(result.distanceKm, km);
    assert.equal(result.durationHours, hours);
  }
  assert.throws(
    () => routeTotals(data, ["igatpuri-vashi"], "vashi"),
    /Disconnected/
  );
});

test("repeated evaluations are identical and do not mutate the canonical inputs", () => {
  const frozenSnapshot = JSON.stringify(data);
  assert.deepEqual(evaluateAll(data), evaluateAll(structuredClone(data)));
  assert.equal(JSON.stringify(data), frozenSnapshot);
});

test("slots require complete unloading, with exact closing and overnight boundaries", () => {
  const market = byId(data.markets, "vashi");
  assert.equal(unloadingWaitHours(market, 14), 0); // 14:00 + 2 hours fits.
  assert.equal(unloadingWaitHours(market, 15), 3); // Must use 18:00 slot.
  assert.equal(unloadingWaitHours(market, 22), 14); // Next day 12:00.
  assert.equal(unloadingWaitHours(market, 24 + 12), 0);
});

test("curve interpolation, inclusive grade thresholds and exhaustion are explicit", () => {
  assert.equal(qualityAt(data, 24).qualityFraction, 0.92);
  assert.equal(qualityAt(data, 48).grade, "B");
  assert.equal(qualityAt(data, 120).grade, "C");
  assert.equal(qualityAt(data, 120).referenceShelfLifeRemainingHours, 0);
  assert.equal(qualityAt(data, 120.01).grade, "REJECT");
  assert.equal(qualityAt(data, 120.01).saleableFraction, 0);
  assert.equal(qualityAt(data, 1000).referenceShelfLifeRemainingHours, 0);
  assert.equal(qualityAt(data, 1000).qualityFraction, 0);
  assert.throws(() => qualityAt(data, -1), /Invalid effective age/);
});

test("four reefers must fit by weight and volume; one reefer cannot carry the lot", () => {
  const van = byId(data.vehicles, "reefer-van");
  assertVehicleCapacity(data, van, 4);
  assert.throws(() => assertVehicleCapacity(data, van, 1), /Weight capacity/);
  assert.throws(
    () => assertVehicleCapacity(data, { ...van, capacityM3: 4 }, 4),
    /Volume capacity/
  );
  assert.throws(() => assertVehicleCapacity(data, van, 5), /fleet count/);
});

test("storage checks both free space and maximum intake, including destination rejection", () => {
  assertStorageCapacity(data, byId(data.storageFacilities, "nashik-demo-cold"));
  assert.throws(
    () =>
      assertStorageCapacity(
        data,
        byId(data.storageFacilities, "vashi-demo-cold")
      ),
    /storage capacity/
  );
  assert.throws(
    () =>
      assertStorageCapacity(data, {
        ...data.storageFacilities[0],
        maxIntakeKg: 9000,
      }),
    /intake capacity/
  );
});

test("replacement cost keeps sunk cost, charges every van and permits negative net proceeds", () => {
  const results = evaluateAll(data);
  const bad = byId(results, "negative-recovery");
  assert.equal(bad.costBreakdownInr.transport, 40 * 32 + 4 * 220 * 55);
  assert.equal(
    bad.interventionCostInr,
    300000 + 4 * 5000 + 10000 * 0.6 + 4 * 220 * 55
  );
  assert(bad.interventionCostInr > bad.grossProceedsInr);
  assert(bad.netProceedsInr < 0);
  assert.equal(bad.recommendation, "REJECT_INTERVENTION");
  assert.equal(
    byId(results, "alternative-recovery").incrementalNetInr,
    144330.67
  );
});

const corruptions = [
  [
    "unit mismatch",
    (d) => {
      d.units.kgPerMt = 100;
    },
    /Unit contract/,
  ],
  [
    "negative transit time",
    (d) => {
      d.edges[0].durationHours = -1;
    },
    /non-negative/,
  ],
  [
    "non-finite edge",
    (d) => {
      d.edges[0].distanceKm = Infinity;
    },
    /finite/,
  ],
  [
    "zero vehicle capacity",
    (d) => {
      d.vehicles[0].capacityKg = 0;
    },
    /positive/,
  ],
  [
    "zero throughput",
    (d) => {
      d.storageFacilities[0].intakeKgPerHour = 0;
    },
    /positive/,
  ],
  [
    "invalid latitude",
    (d) => {
      d.nodes[0].latitudeDeg = 91;
    },
    /latitude/,
  ],
  [
    "invalid longitude",
    (d) => {
      d.nodes[0].longitudeDeg = -181;
    },
    /longitude/,
  ],
  [
    "dangling edge",
    (d) => {
      d.edges[0].to = "missing";
    },
    /Unknown reference/,
  ],
  [
    "duplicate edge ID",
    (d) => {
      d.edges[1].id = d.edges[0].id;
    },
    /Duplicate/,
  ],
  [
    "disconnected route",
    (d) => {
      d.routes[0].edgeIds.reverse();
    },
    /Disconnected/,
  ],
  [
    "improving decay curve",
    (d) => {
      d.crop.qualityCurve[1].qualityFraction = 0.98;
    },
    /cannot improve/,
  ],
  [
    "unknown provenance",
    (d) => {
      d.markets[0].evidenceId = "missing";
    },
    /Unknown reference/,
  ],
  [
    "missing simulated flag",
    (d) => {
      delete d.nodes[0].status;
    },
    /SIMULATED/,
  ],
  [
    "overlapping slots",
    (d) => {
      d.markets[0].unloadingSlotsLocalHours = [
        [12, 16],
        [15, 20],
      ];
    },
    /overlapping/,
  ],
  [
    "insufficient unloading capacity",
    (d) => {
      d.markets[1].parallelVehicleCapacity = 1;
    },
    /parallel unloading/,
  ],
  [
    "changed comparison prefix",
    (d) => {
      byId(d.scenarios, "alternative-recovery").steps[0].surchargeInr = 100;
    },
    /sunk-cost prefix/,
  ],
  [
    "wrong destination",
    (d) => {
      byId(d.scenarios, "normal-delivery").marketId = "pune";
    },
    /wrong market/,
  ],
  [
    "unknown action",
    (d) => {
      byId(d.scenarios, "normal-delivery").steps.push({ type: "teleport" });
    },
    /Unknown step/,
  ],
];
for (const [name, edit, message] of corruptions) {
  test(`rejects ${name}`, () =>
    assert.throws(() => validateDemo(mutated(edit), evidence), message));
}

test("external evidence requires a retrieval date, units and methodology", () => {
  for (const key of ["retrievedOn", "units", "methodology"]) {
    const broken = structuredClone(evidence);
    delete broken[1][key];
    assert.throws(() => validateDemo(data, broken));
  }
});
