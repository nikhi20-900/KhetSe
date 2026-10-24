# Evidence & Data Provenance Register

Generated from [`data/evidence-register.json`](../data/evidence-register.json). Update that file, then run `npm run docs:generate`.

**No empirical numerical benchmark is imported into the operational baseline.** Reference-only sources support names and qualitative context. All numerical model parameters and results are **SIMULATED**. Standard unit conversions are definitions, not measured data.

A missing source date is recorded as unknown, not substituted with the retrieval date. The internal simulated record uses its creation date. No provider endorsement or calibration is implied.

| ID      | Classification | Source                                                                                                                                             | Retrieved on | Source date |
| ------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| REQ-001 | REQUIREMENT    | [KhetSe issue #1 — Define demo crop, region, and evidence register](https://github.com/nikhi20-900/khetse/issues/1)                                | 2026-10-24   | 2026-10-24  |
| REF-001 | REFERENCE_ONLY | [ICAR / Directorate of Onion and Garlic Research — Onion Cold Storage: Potential to Stabilize Price Fluctuation](https://icar.org.in/en/node/4701) | 2026-10-24   | not stated  |
| REF-002 | REFERENCE_ONLY | [Agricultural Produce Market Committee, Pimpalgaon Baswant — official website](https://apmcpimpalgaon.com/)                                        | 2026-10-24   | not stated  |
| REF-003 | REFERENCE_ONLY | [Mumbai APMC — official website](https://mumbaiapmc.org/)                                                                                          | 2026-10-24   | not stated  |
| REF-004 | REFERENCE_ONLY | [APMC Pune — official Contact Details](https://apmcpune.in/en/contact-en/contact-details-en)                                                       | 2026-10-24   | not stated  |
| SIM-001 | SIMULATED      | KhetSe issue #1 reproducible demonstration design v1                                                                                               | 2026-10-24   | 2026-10-24  |

## REQ-001

**Source:** [KhetSe issue #1 — Define demo crop, region, and evidence register](https://github.com/nikhi20-900/khetse/issues/1)

**Classification:** REQUIREMENT. **Retrieved:** 2026-10-24. **Source date:** 2026-10-24.

**Units:** kg; MT; named locations.

**Used for:** `crop.name`, `crop.quantityKg`, `nodes`, `vehicles`, `scenarios`.

**Supported statement:** Issue selects the crop trade label, origin, 10 MT lot, three destination names, transport categories, and six scenario types.

**Method and limits:** Read issue body through GitHub. A product requirement is not empirical evidence. Surat is included as requested; its exact terminal has not been independently verified.

## REF-001

**Source:** [ICAR / Directorate of Onion and Garlic Research — Onion Cold Storage: Potential to Stabilize Price Fluctuation](https://icar.org.in/en/node/4701)

**Classification:** REFERENCE_ONLY. **Retrieved:** 2026-10-24. **Source date:** not stated.

**Units:** qualitative handling context; no numeric benchmark imported.

**Used for:** `crop.handling`, `vehicles.handling`, `storageFacilities.handling`.

**Supported statement:** Ventilation and storage conditions matter for onions; conventional cold storage has humidity, condensation, and post-storage sprouting considerations.

**Method and limits:** Read sections Storage facility available in India, Design of New Cold Storage, and Post storage behaviour. Publication date is not shown. Do not convert the reported long-term storage observations into hourly transport decay. No loss percentages, temperature recommendations, or efficacy estimates from this source calibrate the demo.

## REF-002

**Source:** [Agricultural Produce Market Committee, Pimpalgaon Baswant — official website](https://apmcpimpalgaon.com/)

**Classification:** REFERENCE_ONLY. **Retrieved:** 2026-10-24. **Source date:** not stated.

**Units:** named location / commodity label.

**Used for:** `crop.name`, `nodes.pimpalgaon.name`.

**Supported statement:** The official market identifies Pimpalgaon Baswant in Nashik district and lists Red Onion among its commodity labels.

**Method and limits:** Read address and commodity labels. No price, coordinate, harvest-season, or cultivar benchmark imported. Displayed zero price entries are not evidence of a zero market value.

## REF-003

**Source:** [Mumbai APMC — official website](https://mumbaiapmc.org/)

**Classification:** REFERENCE_ONLY. **Retrieved:** 2026-10-24. **Source date:** not stated.

**Units:** named location / market type.

**Used for:** `nodes.vashi.name`.

**Supported statement:** Mumbai APMC lists an onion-potato market and a Vashi, Navi Mumbai address.

**Method and limits:** Read market list and address. Identity only: prices, unloading slots, fees and coordinates are independently simulated and are not the official operating timetable.

## REF-004

**Source:** [APMC Pune — official Contact Details](https://apmcpune.in/en/contact-en/contact-details-en)

**Classification:** REFERENCE_ONLY. **Retrieved:** 2026-10-24. **Source date:** not stated.

**Units:** named location.

**Used for:** `nodes.pune.name`.

**Supported statement:** The official APMC Pune contact page identifies its market yard at Gultekdi, Pune.

**Method and limits:** Read the contact address. No coordinate, market rate, opening-time or capacity benchmark imported.

## SIM-001

**Source:** KhetSe issue #1 reproducible demonstration design v1

**Classification:** SIMULATED. **Retrieved:** 2026-10-24. **Source date:** 2026-10-24.

**Units:** kg; MT; m3; INR; km; hours; °C; % RH; decimal degrees; fractions; derived compound rates.

**Used for:** `clock`, `crop`, `environments`, `nodes`, `edges`, `routes`, `vehicles`, `markets`, `storageFacilities`, `scenarios`.

**Supported statement:** All operational numbers, coordinates, grade bands, financial terms, event timings and expected outcomes are deliberately constructed demonstration assumptions.

**Method and limits:** Hand-authored fixtures; fixed directed edges; no random values, GPS, traffic, live price feeds or sensor readings. Curve and age multipliers are chosen to exercise grade changes and cost tradeoffs, not fit to field data. The emergency surcharge is an intentional stress case, not a carrier quote. retrieval date records creation for this internal source.

## Before adding an empirical benchmark

Create a distinct record with the exact source URL/title, source date (or explicit unknown), retrieval date, original units, conversions, observation period, cultivar/grade/region context, measurement or sampling method and limitations. Map it to the exact affected parameter. Update validation intentionally if a parameter becomes empirical; never label a guessed value empirical because a nearby reference looks relevant.
