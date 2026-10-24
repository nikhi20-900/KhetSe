import { readFile, writeFile } from "node:fs/promises";
import { format, resolveConfig } from "prettier";
import {
  byId,
  loadBaseline,
  loadEvidence,
  routeTotals,
} from "./reference-model.mjs";
import { validateDemo } from "./validate-demo.mjs";

const data = await loadBaseline();
const evidence = await loadEvidence();
const results = validateDemo(data, evidence);
const check = process.argv.includes("--check");
const safe = (cell) =>
  String(cell).replaceAll("|", "\\|").replaceAll("\n", " ");
const table = (headers, rows) =>
  [headers, headers.map(() => "---"), ...rows]
    .map((row) => `| ${row.map(safe).join(" | ")} |`)
    .join("\n");
const number = (value) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
const money = (value) => value.toFixed(2);
const localTime = (hours) =>
  `${String(Math.floor(hours)).padStart(2, "0")}:${String(Math.round((hours % 1) * 60)).padStart(2, "0")}`;
const slotText = (market) =>
  market.unloadingSlotsLocalHours
    .map(([start, end]) => `${localTime(start)}–${localTime(end)}`)
    .join("; ");
const stepText = (step) => {
  if (step.type === "dispatch")
    return `dispatch ${step.count} × ${step.vehicleId}; surcharge INR ${step.surchargeInr}`;
  if (step.type === "travel") return step.edgeId;
  if (step.type === "pause")
    return `wait ${step.durationHours} h (${step.environmentId}); fee INR ${step.costInr}`;
  if (step.type === "store")
    return `${step.facilityId}: hold ${step.holdingHours} h, plus intake/release`;
  throw new Error("Unknown step");
};

const sections = [
  "## Canonical baseline tables — SIMULATED",
  "Generated from the JSON inputs by `npm run docs:generate`. Do not edit these tables directly. All operational values and outcomes in this section are **SIMULATED**.",
  table(
    ["Field", "Value"],
    [
      ["Baseline", `${data.id} (schema ${data.schemaVersion})`],
      ["Crop / initial grade", `${data.crop.name} / ${data.crop.initialGrade}`],
      [
        "Harvest quantity",
        `${data.crop.quantityKg} kg = ${data.crop.quantityKg / data.units.kgPerMt} MT`,
      ],
      [
        "Bulk density / derived load volume",
        `${data.crop.bulkDensityKgPerM3} kg/m3 / ${data.crop.quantityKg / data.crop.bulkDensityKgPerM3} m3`,
      ],
      ["Origin", byId(data.nodes, data.crop.originNodeId).name],
      ["Harvest window start", data.clock.harvestWindowStart],
      ["Harvest window end", data.clock.harvestWindowEnd],
      [
        "Dispatch / relative t = 0",
        `${data.clock.dispatchAt} (${data.clock.timeZone})`,
      ],
      [
        "Reference market-acceptance endpoint",
        `${data.crop.referenceShelfLifeHours} effective hours`,
      ],
    ]
  ),
  "### Units",
  table(
    ["Quantity", "Canonical unit / conversion"],
    Object.entries(data.units)
  ),
  "### Crop curve and grades — SIMULATED",
  table(
    ["Effective age (hours)", "Quality fraction", "Saleable fraction"],
    data.crop.qualityCurve.map((p) => [
      p.effectiveAgeHours,
      p.qualityFraction,
      p.saleableFraction,
    ])
  ),
  table(
    ["Grade", "Minimum quality (inclusive)", "Price multiplier"],
    data.crop.grades.map((g) => [
      g.id,
      g.minimumQualityFraction,
      g.priceMultiplier,
    ])
  ),
  "### Environment profiles — SIMULATED",
  "Profile identifiers select explicit age multipliers. Temperature and humidity are descriptive fixture values; there is no inferred temperature-to-decay function.",
  table(
    [
      "Profile",
      "Temperature (°C)",
      "Humidity (% RH)",
      "Effective hours / elapsed hour",
    ],
    data.environments.map((e) => [
      e.id,
      e.temperatureC,
      e.relativeHumidityPct,
      e.ageMultiplier,
    ])
  ),
  "### Geographic anchors — SIMULATED",
  table(
    ["Node", "Label", "Latitude (degrees)", "Longitude (degrees)"],
    data.nodes.map((n) => [n.id, n.name, n.latitudeDeg, n.longitudeDeg])
  ),
  "### Directed edge weights — SIMULATED",
  table(
    ["Edge", "From → to", "Distance (km)", "Duration (hours)"],
    data.edges.map((e) => [
      e.id,
      `${e.from} → ${e.to}`,
      e.distanceKm,
      e.durationHours,
    ])
  ),
  "### Complete reference routes — SIMULATED",
  table(
    ["Route", "Ordered edges", "Distance (km)", "Transit window (hours)"],
    data.routes.map((r) => {
      const totals = routeTotals(data, r.edgeIds);
      return [
        r.id,
        r.edgeIds.join(" → "),
        totals.distanceKm,
        `[${totals.durationHours}, ${totals.durationHours}]`,
      ];
    })
  ),
  "### Vehicle profiles — SIMULATED",
  table(
    [
      "Vehicle",
      "Payload (kg)",
      "Volume (m3)",
      "Available",
      "Dispatch (INR/vehicle)",
      "Rate (INR/vehicle-km)",
      "Loading (INR/kg)",
      "Transfer (hours)",
      "Environment",
    ],
    data.vehicles.map((v) => [
      v.name,
      v.capacityKg,
      v.capacityM3,
      v.availableCount,
      v.fixedDispatchInr,
      v.rateInrPerKm,
      v.loadingInrPerKg,
      v.transferHours,
      v.environmentId,
    ])
  ),
  ...data.vehicles.map((v) => `- **${v.id}:** ${v.handling}`),
  "### Destination profiles — SIMULATED",
  table(
    [
      "Market",
      "Role",
      "Grade A price (INR/kg)",
      "Daily unloading slots (IST)",
      "Unload (hours)",
      "Parallel vehicles",
    ],
    data.markets.map((m) => [
      m.id,
      m.role,
      m.priceInrPerKg,
      slotText(m),
      m.unloadingHours,
      m.parallelVehicleCapacity,
    ])
  ),
  table(
    [
      "Market",
      "Free waiting (hours)",
      "Detention (INR/vehicle-hour)",
      "Unload (INR/kg)",
      "Market fee (fraction of gross)",
    ],
    data.markets.map((m) => [
      m.id,
      m.freeWaitingHours,
      m.detentionInrPerVehicleHour,
      m.unloadingInrPerKg,
      m.marketFeeFraction,
    ])
  ),
  "### Storage profiles — SIMULATED",
  table(
    [
      "Facility",
      "Node",
      "Total / free / maximum intake (kg)",
      "Intake (kg/hour)",
      "Release (hours)",
      "Environment",
    ],
    data.storageFacilities.map((f) => [
      f.id,
      f.nodeId,
      `${f.capacityKg} / ${f.availableCapacityKg} / ${f.maxIntakeKg}`,
      f.intakeKgPerHour,
      f.releaseHours,
      f.environmentId,
    ])
  ),
  table(
    [
      "Facility",
      "Holding (INR/kg-hour)",
      "Intake (INR/kg)",
      "Release (INR/kg)",
    ],
    data.storageFacilities.map((f) => [
      f.id,
      f.holdingInrPerKgHour,
      f.intakeInrPerKg,
      f.releaseInrPerKg,
    ])
  ),
  ...data.storageFacilities.map((f) => `- **${f.id}:** ${f.handling}`),
  "### Reference scenario inputs — SIMULATED",
  ...data.scenarios.flatMap((s) => [
    `#### ${s.id}`,
    s.description,
    s.steps.map((step, index) => `${index + 1}. ${stepText(step)}`).join("\n"),
  ]),
  "### Expected outputs — SIMULATED",
  "Arrival, wait and completion are elapsed hours from dispatch. Completion includes unloading; grade and saleable mass are evaluated at completion. Distances count the lot path once, while transport cost counts every active vehicle.",
  table(
    [
      "Scenario",
      "km",
      "Arrival h",
      "Wait h",
      "Complete h",
      "Effective age h",
      "Grade",
      "Saleable kg",
    ],
    results.map((r) => [
      r.id,
      r.distanceKm,
      r.arrivalHours,
      r.waitingHours,
      r.completionHours,
      number(r.effectiveAgeHours),
      r.grade,
      r.saleableKg,
    ])
  ),
  table(
    [
      "Scenario",
      "Gross INR",
      "Costs INR",
      "Net INR",
      "Delta vs no action INR",
      "Decision",
    ],
    results.map((r) => [
      r.id,
      money(r.grossProceedsInr),
      money(r.totalCostsInr),
      money(r.netProceedsInr),
      r.incrementalNetInr === undefined ? "n/a" : money(r.incrementalNetInr),
      r.recommendation ?? "reference",
    ])
  ),
  table(
    [
      "Scenario",
      "Dispatch INR",
      "Transport INR",
      "Loading INR",
      "Repair/surcharge INR",
      "Storage INR",
      "Detention INR",
      "Unloading INR",
      "Market fee INR",
    ],
    results.map((r) => [
      r.id,
      ...[
        "dispatch",
        "transport",
        "loading",
        "intervention",
        "storage",
        "detention",
        "unloading",
        "marketFees",
      ].map((key) => money(r.costBreakdownInr[key])),
    ])
  ),
  table(
    [
      "Scenario",
      "Direct intervention spend (INR)",
      "Reference-condition life remaining (hours)",
    ],
    results.map((r) => [
      r.id,
      money(r.interventionCostInr),
      number(r.referenceShelfLifeRemainingHours),
    ])
  ),
];

const assumptionsUrl = new URL("../docs/assumptions.md", import.meta.url);
const assumptions = await readFile(assumptionsUrl, "utf8");
const begin = "<!-- BEGIN GENERATED BASELINE -->";
const end = "<!-- END GENERATED BASELINE -->";
if (
  assumptions.split(begin).length !== 2 ||
  assumptions.split(end).length !== 2
)
  throw new Error("Missing or duplicated baseline markers");
const generated = assumptions.replace(
  new RegExp(`${begin}[\\s\\S]*?${end}`),
  `${begin}\n\n${sections.join("\n\n")}\n\n${end}`
);

const register =
  [
    "# Evidence & Data Provenance Register",
    "Generated from [`data/evidence-register.json`](../data/evidence-register.json). Update that file, then run `npm run docs:generate`.",
    "**No empirical numerical benchmark is imported into the operational baseline.** Reference-only sources support names and qualitative context. All numerical model parameters and results are **SIMULATED**. Standard unit conversions are definitions, not measured data.",
    "A missing source date is recorded as unknown, not substituted with the retrieval date. The internal simulated record uses its creation date. No provider endorsement or calibration is implied.",
    table(
      ["ID", "Classification", "Source", "Retrieved on", "Source date"],
      evidence.map((e) => [
        e.id,
        e.classification,
        e.url ? `[${e.sourceName}](${e.url})` : e.sourceName,
        e.retrievedOn,
        e.sourceDate ?? "not stated",
      ])
    ),
    ...evidence.flatMap((e) => [
      `## ${e.id}`,
      `**Source:** ${e.url ? `[${e.sourceName}](${e.url})` : e.sourceName}`,
      `**Classification:** ${e.classification}. **Retrieved:** ${e.retrievedOn}. **Source date:** ${e.sourceDate ?? "not stated"}.`,
      `**Units:** ${e.units.join("; ")}.`,
      `**Used for:** ${e.appliesTo.map((path) => `\`${path}\``).join(", ")}.`,
      `**Supported statement:** ${e.claim}`,
      `**Method and limits:** ${e.methodology}`,
    ]),
    "## Before adding an empirical benchmark",
    "Create a distinct record with the exact source URL/title, source date (or explicit unknown), retrieval date, original units, conversions, observation period, cultivar/grade/region context, measurement or sampling method and limitations. Map it to the exact affected parameter. Update validation intentionally if a parameter becomes empirical; never label a guessed value empirical because a nearby reference looks relevant.",
  ].join("\n\n") + "\n";

for (const [url, source] of [
  [assumptionsUrl, generated],
  [new URL("../docs/evidence-register.md", import.meta.url), register],
]) {
  const content = await format(source, {
    ...(await resolveConfig(url.pathname)),
    filepath: url.pathname,
  });
  if (check) {
    const existing = await readFile(url, "utf8").catch((error) => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    if (existing !== content)
      throw new Error(
        `Stale documentation: ${url.pathname}; run npm run docs:generate`
      );
  } else await writeFile(url, content);
}
console.log(
  check
    ? "Generated documentation matches the canonical data."
    : "Updated assumptions tables and evidence register."
);
