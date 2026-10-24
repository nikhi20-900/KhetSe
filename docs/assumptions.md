# KhetSe demo assumptions

Implements [issue #1](https://github.com/nikhi20-900/khetse/issues/1).
The source of truth is [`data/demo-baseline.json`](../data/demo-baseline.json).
Provenance lives in [`data/evidence-register.json`](../data/evidence-register.json),
with a readable view in the [Evidence & Data Provenance Register](evidence-register.md).

This baseline supersedes the unverified numeric examples in the initial scaffold.
`scripts/reference-model.mjs` is a fixture-verification tool, not the application's
TypeScript domain engine. Future `lib/domain/*` implementations should consume the
canonical JSON inputs and reproduce these outcomes using the project's integer
money contract. API examples in `docs/API_CONTRACTS.md` describe planned shapes;
their illustrative values are not a second baseline. Persistence adapters must
explicitly map kg capacity and hourly rates to the schema's slot and daily-rate
fields; those quantities cannot be assigned interchangeably.

## Status and scope

**SIMULATED:** every operational number, map pin, route weight, event time,
temperature, price, fee, capacity, grade, decay coefficient and outcome below.
Real market names provide context only. The coordinates are illustrative anchors,
not verified gates; distances are authored weights, not road-network measurements.
Surat's precise terminal remains unverified. The cold rooms and transfer checkpoint
are fictional. No real operator availability or commercial quote is represented.

The crop is the issue's **Nashik Red Onion** trade label, not a verified cultivar.
The dated harvest window is a scenario choice, not a claim about a regional season.
At dispatch the lot is assumed to have been cured, dried and sorted. The pre-dispatch
condition is already reflected in the initial quality; the clock does not charge
those preceding days twice. Initial loading finishes at dispatch; its cost is included.

ICAR's handling context motivates explicitly considering ventilation, humidity
and cold-storage transitions ([REF-001](evidence-register.md#ref-001)). It does not
calibrate this curve. None of the simulated age multipliers establish the efficacy
of a truck or cold room. Curing and cold-chain compatibility are assumed for this
fixture, not verified by hardware or by a biological model.

## Shared calculation contract

- Store physical mass in **kg**; **MT** is a display conversion only. Volume is
  **m3**, distance **km**, elapsed time **hours**, money **INR**, temperature **°C**.
  Prices are INR/kg, never INR/quintal. Fractions use [0, 1]; humidity uses % RH.
- All instants include an explicit offset and use `Asia/Kolkata`. Relative scenario
  time starts at dispatch. Never use the execution machine's time or today's date.
- All quantities are net bulb mass. Loose compartments are included in vehicle
  tare, not the shipment. Bulk volume includes air gaps. Adding sacks or pallets
  requires explicitly adding their mass and volume before checking capacity.
  Vehicle figures are synthetic usable payload, not legal weight certifications.
- Allocate the entire lot at every step. Check both kg and m3 against the selected
  fleet. Multiple vehicles split mass and volume evenly and travel simultaneously.
  A van's rate and dispatch cost apply to **each** van, not to the fleet once.
- Directed edges have immutable distance and duration. No implicit reverse edge,
  geodesic routing, random traffic, time-dependent weights or map-provider lookup.
  Route transit windows below are `[duration, duration]`, inclusive, for reproducibility.
  Handling, disruptions and market queues add time separately.
- Replacement dispatch includes transfer time at ambient conditions. The original
  truck's dispatch, loading and travelled distance remain sunk costs. For this
  demo, no untravelled distance, return journey, cancellation or towing charge is
  added unless present as an explicit intervention surcharge.
- Storage requires both free space and intake capacity for the full lot. Intake
  takes `quantityKg / intakeKgPerHour`; intake and conditioned release age at the
  ambient rate. Only the explicit holding interval uses the cold rate and holding
  charge. Each facility visit includes its intake and release charges. The truck
  remains assigned; warehouse idle time has no separate truck-hire charge here.
- Unloading slots repeat every local calendar day, including holidays. They are
  **invented demo reservations, not official APMC operating hours**. The entire
  unloading operation must fit in a slot; finishing exactly at close is allowed.
  Simultaneous fleet unloading requires enough parallel bays. Waiting ages the
  lot in its current vehicle; unloading ages it at ambient conditions.
- Detention is continuous, pro-rated INR per vehicle-hour of market queue time
  above the free allowance. It excludes unloading, storage and road delays. No
  rounding up to an hour or day. This is a demo contract, not a market tariff.

## Quality and financial formulas

`effectiveAgeHours = sum(segmentHours * segmentEnvironment.ageMultiplier)`

Linearly interpolate `qualityFraction` and `saleableFraction` between adjacent
curve knots. Beyond the last knot both stay zero. Choose the first descending
grade whose minimum quality is met, including equality. Rejected grade has zero
saleable mass and revenue. Other grade discounts apply only to the remaining
saleable mass; loss of quantity and reduced price are distinct assumptions.

`referenceShelfLifeRemainingHours = max(0, referenceShelfLifeHours - effectiveAgeHours)`

This remaining life is in **reference-condition equivalent hours**, not wall-clock
hours under arbitrary future conditions and not a real onion expiry prediction.
For a fixed future environment only, divide it by that environment's age multiplier.
The endpoint is the lowest saleable grade's acceptance threshold. Sale exactly at
the endpoint is permitted, with no remaining time to wait. The raw quality curve
continues beyond rejection, but rejected lots have zero saleable mass and revenue.

```text
saleableKg = initialQuantityKg * saleableFraction
grossProceedsInr = saleableKg * marketPriceInrPerKg * gradePriceMultiplier
transportCostInr = sum(travelledKm * activeVehicleRateInrPerKm * activeVehicleCount)
dispatchCostInr = sum(fixedDispatchInr * count for each dispatched fleet)
loadingCostInr = sum(initialQuantityKg * loadingInrPerKg for each dispatch)
storageCostInr = quantityKg * (intakeRate + releaseRate + holdingHours * holdingRate)
detentionCostInr = max(0, waitingHours - freeWaitingHours) * detentionRate * vehicleCount
marketFeeInr = grossProceedsInr * marketFeeFraction
netProceedsInr = grossProceedsInr - allModelledCostsInr
incrementalNetInr = interventionScenario.netProceedsInr - noActionScenario.netProceedsInr
```

Loading, storage and unloading charge the original mass; rejected bulbs remain
in the cargo until market sorting. All sale proceeds are recognised at unloading
completion, using the resulting quality. No live auction or settlement is implied.
Net proceeds exclude cultivation costs, taxes, finance, packaging and disposal;
they are **not farmer profit**. Negative values remain negative.

`interventionCostInr` reports paid repair/surcharges, replacement-fleet dispatch,
transfer loading, replacement-fleet distance, and storage. It excludes the common
original-truck costs and ordinary market charges. The negative fixture makes this
direct intervention spend exceed **all** gross salvage revenue, not merely the
incremental benefit. The recommendation still uses the complete net-cost comparison.

Calculations retain full JavaScript numeric precision until reporting. INR output
rounds to two decimals and kg output to three; independently rounded lines can
differ from the rounded total by one paisa. This is a fixture calculator, not a
financial ledger; a production ledger needs a specified decimal/rounding policy.

## Fair comparisons and scenario interpretation

Every scenario is a fresh run of the same lot. Breakdown, alternative recovery,
no-action and negative recovery have the **same first edge, failure checkpoint,
initial vehicle and sunk costs**. The hypothetical failure happens on arrival at
that checkpoint. Subsequent choices branch from that same decision instant.

No action means waiting for the carrier's included repair and then finishing the
original journey; it does not mean discarding the crop or assigning it zero value.
Paid repair shortens that wait. The stored recovery is one candidate, not proof
that storage is optimal: compare other candidates when an optimiser is added.
The expensive reefer case is deliberately forced so the calculator can reject it.
Normal delivery is the undisrupted reference; the traffic-delay scenario is a
separate disruption and is not used as the breakdown counterfactual.

<!-- BEGIN GENERATED BASELINE -->

## Canonical baseline tables — SIMULATED

Generated from the JSON inputs by `npm run docs:generate`. Do not edit these tables directly. All operational values and outcomes in this section are **SIMULATED**.

| Field                                | Value                                    |
| ------------------------------------ | ---------------------------------------- |
| Baseline                             | nashik-red-onion-10mt-v1 (schema 1.0.0)  |
| Crop / initial grade                 | Nashik Red Onion / A                     |
| Harvest quantity                     | 10000 kg = 10 MT                         |
| Bulk density / derived load volume   | 500 kg/m3 / 20 m3                        |
| Origin                               | Pimpalgaon Baswant, Maharashtra          |
| Harvest window start                 | 2026-10-20T06:00:00+05:30                |
| Harvest window end                   | 2026-10-20T12:00:00+05:30                |
| Dispatch / relative t = 0            | 2026-10-24T06:00:00+05:30 (Asia/Kolkata) |
| Reference market-acceptance endpoint | 120 effective hours                      |

### Units

| Quantity      | Canonical unit / conversion |
| ------------- | --------------------------- |
| mass          | kg                          |
| displayMass   | MT                          |
| kgPerMt       | 1000                        |
| volume        | m3                          |
| currency      | INR                         |
| distance      | km                          |
| duration      | hours                       |
| temperature   | °C                          |
| coordinates   | decimal degrees (WGS84)     |
| quality       | fraction [0,1]              |
| humidity      | % RH                        |
| price         | INR/kg                      |
| distanceRate  | INR/km                      |
| holdingRate   | INR/(kg*hour)               |
| detentionRate | INR/(vehicle*hour)          |
| throughput    | kg/hour                     |

### Crop curve and grades — SIMULATED

| Effective age (hours) | Quality fraction | Saleable fraction |
| --------------------- | ---------------- | ----------------- |
| 0                     | 0.96             | 1                 |
| 24                    | 0.92             | 0.99              |
| 48                    | 0.8              | 0.96              |
| 72                    | 0.65             | 0.9               |
| 120                   | 0.4              | 0.65              |
| 168                   | 0.2              | 0.3               |
| 240                   | 0                | 0                 |

| Grade  | Minimum quality (inclusive) | Price multiplier |
| ------ | --------------------------- | ---------------- |
| A      | 0.9                         | 1                |
| B      | 0.7                         | 0.8              |
| C      | 0.4                         | 0.5              |
| REJECT | 0                           | 0                |

### Environment profiles — SIMULATED

Profile identifiers select explicit age multipliers. Temperature and humidity are descriptive fixture values; there is no inferred temperature-to-decay function.

| Profile     | Temperature (°C) | Humidity (% RH) | Effective hours / elapsed hour |
| ----------- | ---------------- | --------------- | ------------------------------ |
| ambient     | 30               | 65              | 1                              |
| ventilated  | 27               | 65              | 0.75                           |
| cold        | 5                | 65              | 0.3                            |
| stalled-hot | 35               | 75              | 2                              |

### Geographic anchors — SIMULATED

| Node        | Label                                             | Latitude (degrees) | Longitude (degrees) |
| ----------- | ------------------------------------------------- | ------------------ | ------------------- |
| pimpalgaon  | Pimpalgaon Baswant, Maharashtra                   | 20.17              | 73.99               |
| nashik      | Nashik transfer checkpoint (fictional)            | 20                 | 73.79               |
| igatpuri    | Igatpuri checkpoint (fictional)                   | 19.7               | 73.56               |
| vashi       | Vashi APMC Mumbai                                 | 19.08              | 73                  |
| pune        | Pune APMC, Gultekdi                               | 18.48              | 73.88               |
| surat       | Surat APMC (demo terminal; exact yard unverified) | 21.19              | 72.87               |
| nashik-cold | Nashik demo cold room (fictional)                 | 19.98              | 73.8                |
| vashi-cold  | Vashi demo cold room (fictional)                  | 19.1               | 73.01               |

### Directed edge weights — SIMULATED

| Edge               | From → to            | Distance (km) | Duration (hours) |
| ------------------ | -------------------- | ------------- | ---------------- |
| pimpalgaon-nashik  | pimpalgaon → nashik  | 40            | 1                |
| nashik-igatpuri    | nashik → igatpuri    | 50            | 1.5              |
| igatpuri-vashi     | igatpuri → vashi     | 160           | 4                |
| nashik-pune        | nashik → pune        | 220           | 5.5              |
| nashik-surat       | nashik → surat       | 230           | 5                |
| nashik-cold-intake | nashik → nashik-cold | 10            | 0.5              |
| cold-pune          | nashik-cold → pune   | 220           | 5.5              |
| vashi-cold-intake  | vashi → vashi-cold   | 8             | 0.5              |
| vashi-cold-return  | vashi-cold → vashi   | 8             | 0.5              |

### Complete reference routes — SIMULATED

| Route                 | Ordered edges                                        | Distance (km) | Transit window (hours) |
| --------------------- | ---------------------------------------------------- | ------------- | ---------------------- |
| primary-vashi         | pimpalgaon-nashik → nashik-igatpuri → igatpuri-vashi | 250           | [6.5, 6.5]             |
| secondary-pune        | pimpalgaon-nashik → nashik-pune                      | 260           | [6.5, 6.5]             |
| secondary-surat       | pimpalgaon-nashik → nashik-surat                     | 270           | [6, 6]                 |
| storage-recovery-pune | pimpalgaon-nashik → nashik-cold-intake → cold-pune   | 270           | [7, 7]                 |

### Vehicle profiles — SIMULATED

| Vehicle             | Payload (kg) | Volume (m3) | Available | Dispatch (INR/vehicle) | Rate (INR/vehicle-km) | Loading (INR/kg) | Transfer (hours) | Environment |
| ------------------- | ------------ | ----------- | --------- | ---------------------- | --------------------- | ---------------- | ---------------- | ----------- |
| Standard 10-T truck | 10000        | 25          | 1         | 2000                   | 32                    | 0.2              | 2                | ambient     |
| Ventilated truck    | 10000        | 28          | 1         | 2800                   | 38                    | 0.25             | 2                | ventilated  |
| Reefer van          | 2500         | 7           | 4         | 5000                   | 55                    | 0.6              | 2                | cold        |

- **standard-10t:** Dry bulk compartments; weather protection; do not block airflow. Compartments included in vehicle tare.

- **ventilated-10t:** Maintain bottom/side airflow and keep bulbs dry; no refrigeration guarantee.

- **reefer-van:** Four vans required for the full lot. Assume controlled humidity, airflow and conditioning; no automatic crop compatibility claim. Transfer time includes conditioning.

### Destination profiles — SIMULATED

| Market | Role      | Grade A price (INR/kg) | Daily unloading slots (IST) | Unload (hours) | Parallel vehicles |
| ------ | --------- | ---------------------- | --------------------------- | -------------- | ----------------- |
| vashi  | primary   | 28                     | 12:00–16:00; 18:00–22:00    | 2              | 4                 |
| pune   | secondary | 27                     | 14:00–18:00; 20:00–24:00    | 2              | 4                 |
| surat  | secondary | 30                     | 12:00–18:00; 20:00–24:00    | 2              | 4                 |

| Market | Free waiting (hours) | Detention (INR/vehicle-hour) | Unload (INR/kg) | Market fee (fraction of gross) |
| ------ | -------------------- | ---------------------------- | --------------- | ------------------------------ |
| vashi  | 1                    | 500                          | 0.3             | 0.02                           |
| pune   | 1                    | 400                          | 0.3             | 0.02                           |
| surat  | 1                    | 450                          | 0.3             | 0.02                           |

### Storage profiles — SIMULATED

| Facility         | Node        | Total / free / maximum intake (kg) | Intake (kg/hour) | Release (hours) | Environment |
| ---------------- | ----------- | ---------------------------------- | ---------------- | --------------- | ----------- |
| nashik-demo-cold | nashik-cold | 20000 / 12000 / 12000              | 5000             | 2               | cold        |
| vashi-demo-cold  | vashi-cold  | 10000 / 6000 / 5000                | 2500             | 2               | cold        |

| Facility         | Holding (INR/kg-hour) | Intake (INR/kg) | Release (INR/kg) |
| ---------------- | --------------------- | --------------- | ---------------- |
| nashik-demo-cold | 0.015                 | 0.2             | 0.2              |
| vashi-demo-cold  | 0.02                  | 0.25            | 0.25             |

- **nashik-demo-cold:** Fictional onion-compatible cold room. Assume dry intake, humidity control, airflow, and conditioned release. No real operator or availability claim.

- **vashi-demo-cold:** Fictional destination facility. Full 10,000 kg intake is infeasible; partial-load routing is outside this baseline.

### Reference scenario inputs — SIMULATED

#### normal-delivery

Undisrupted primary route; no intervention.

1. dispatch 1 × standard-10t; surcharge INR 0
2. pimpalgaon-nashik
3. nashik-igatpuri
4. igatpuri-vashi

#### vehicle-breakdown

Breakdown after the first edge; pay for a 24-hour repair and continue to Vashi.

1. dispatch 1 × standard-10t; surcharge INR 0
2. pimpalgaon-nashik
3. wait 24 h (stalled-hot); fee INR 4000
4. nashik-igatpuri
5. igatpuri-vashi

#### transit-delay

Ten-hour delay at Igatpuri; miss the final unloading slot and wait overnight.

1. dispatch 1 × standard-10t; surcharge INR 0
2. pimpalgaon-nashik
3. nashik-igatpuri
4. wait 10 h (ambient); fee INR 0
5. igatpuri-vashi

#### alternative-recovery

At the same breakdown, transfer to a ventilated truck, hold in Nashik cold storage for six hours, then deliver to Pune.

1. dispatch 1 × standard-10t; surcharge INR 0
2. pimpalgaon-nashik
3. dispatch 1 × ventilated-10t; surcharge INR 0
4. nashik-cold-intake
5. nashik-demo-cold: hold 6 h, plus intake/release
6. cold-pune

#### no-action

Same breakdown; wait 48 hours for the carrier's included repair, then resume the original route. No paid intervention; not abandonment.

1. dispatch 1 × standard-10t; surcharge INR 0
2. pimpalgaon-nashik
3. wait 48 h (stalled-hot); fee INR 0
4. nashik-igatpuri
5. igatpuri-vashi

#### negative-recovery

Forced counterexample: four reefer vans and an extreme emergency surcharge exceed all sale proceeds. Reject this intervention.

1. dispatch 1 × standard-10t; surcharge INR 0
2. pimpalgaon-nashik
3. dispatch 4 × reefer-van; surcharge INR 300000
4. nashik-pune

### Expected outputs — SIMULATED

Arrival, wait and completion are elapsed hours from dispatch. Completion includes unloading; grade and saleable mass are evaluated at completion. Distances count the lot path once, while transport cost counts every active vehicle.

| Scenario             | km  | Arrival h | Wait h | Complete h | Effective age h | Grade | Saleable kg |
| -------------------- | --- | --------- | ------ | ---------- | --------------- | ----- | ----------- |
| normal-delivery      | 250 | 6.5       | 0      | 8.5        | 8.5             | A     | 9964.583    |
| vehicle-breakdown    | 250 | 30.5      | 0      | 32.5       | 56.5            | B     | 9387.5      |
| transit-delay        | 250 | 16.5      | 13.5   | 32         | 32              | B     | 9800        |
| alternative-recovery | 270 | 19        | 13     | 34         | 25.05           | A     | 9886.875    |
| no-action            | 250 | 54.5      | 0      | 56.5       | 104.5           | C     | 7307.292    |
| negative-recovery    | 260 | 8.5       | 0      | 10.5       | 6.65            | A     | 9972.292    |

| Scenario             | Gross INR | Costs INR | Net INR    | Delta vs no action INR | Decision              |
| -------------------- | --------- | --------- | ---------- | ---------------------- | --------------------- |
| normal-delivery      | 279008.33 | 20580.17  | 258428.17  | n/a                    | reference             |
| vehicle-breakdown    | 210280.00 | 23205.60  | 187074.40  | 101818.36              | BETTER_THAN_NO_ACTION |
| transit-delay        | 219520.00 | 25640.40  | 193879.60  | n/a                    | reference             |
| alternative-recovery | 266945.63 | 37358.91  | 229586.71  | 144330.67              | BETTER_THAN_NO_ACTION |
| no-action            | 102302.08 | 17046.04  | 85256.04   | n/a                    | reference             |
| negative-recovery    | 269251.88 | 388065.04 | -118813.16 | -204069.20             | REJECT_INTERVENTION   |

| Scenario             | Dispatch INR | Transport INR | Loading INR | Repair/surcharge INR | Storage INR | Detention INR | Unloading INR | Market fee INR |
| -------------------- | ------------ | ------------- | ----------- | -------------------- | ----------- | ------------- | ------------- | -------------- |
| normal-delivery      | 2000.00      | 8000.00       | 2000.00     | 0.00                 | 0.00        | 0.00          | 3000.00       | 5580.17        |
| vehicle-breakdown    | 2000.00      | 8000.00       | 2000.00     | 4000.00              | 0.00        | 0.00          | 3000.00       | 4205.60        |
| transit-delay        | 2000.00      | 8000.00       | 2000.00     | 0.00                 | 0.00        | 6250.00       | 3000.00       | 4390.40        |
| alternative-recovery | 4800.00      | 10020.00      | 4500.00     | 0.00                 | 4900.00     | 4800.00       | 3000.00       | 5338.91        |
| no-action            | 2000.00      | 8000.00       | 2000.00     | 0.00                 | 0.00        | 0.00          | 3000.00       | 2046.04        |
| negative-recovery    | 22000.00     | 49680.00      | 8000.00     | 300000.00            | 0.00        | 0.00          | 3000.00       | 5385.04        |

| Scenario             | Direct intervention spend (INR) | Reference-condition life remaining (hours) |
| -------------------- | ------------------------------- | ------------------------------------------ |
| normal-delivery      | 0.00                            | 111.5                                      |
| vehicle-breakdown    | 4000.00                         | 63.5                                       |
| transit-delay        | 0.00                            | 88                                         |
| alternative-recovery | 18940.00                        | 94.95                                      |
| no-action            | 0.00                            | 15.5                                       |
| negative-recovery    | 374400.00                       | 113.35                                     |

<!-- END GENERATED BASELINE -->

## Verification and boundaries

Run `npm test` from the repository root. The suite checks the physical and financial
unit contract, non-negative times and costs, positive capacities, coordinate bounds,
valid evidence links, connected directed routes, monotone decay, fleet feasibility,
unloading boundaries, shared comparison inputs and independently calculated outputs.
`npm run docs:check` also rejects stale generated tables.

This foundation excludes live GPS tracking, guaranteed minimum realization,
autonomous sensor validation, real-time prices, satellite integrations, hardware
IoT, real market-yard scraping and operational navigation. It makes no claim of
observed spoilage savings or validated recovery performance. New empirical numbers
must first receive their own source, retrieval date, original unit, conversion,
measurement method, sample context and limitations in the evidence register;
they must not silently replace simulated parameters.
