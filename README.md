# 🌾 KhetSe

> **Price portals show prices. KhetSe helps compare what may remain after selling and delivery costs.**

KhetSe is a farmer-first farm-to-market decision-support prototype. It is designed to help compare selling options using **estimated net proceeds**, then examine how a delivery plan might respond to a disruption.

[![Track](https://img.shields.io/badge/Track-IC26--01--10%20Open%20Agri--Innovation-orange.svg)](#problem-statement-alignment)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](#technology-stack)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](#technology-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](#technology-stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1.svg)](#technology-stack)
[![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18.svg)](#testing-and-validation)
[![License](https://img.shields.io/badge/License-see%20LICENSE-green.svg)](LICENSE)

## Contents

- [The problem](#the-problem)
- [What KhetSe does](#what-khetse-does)
- [How the workflow works](#how-the-workflow-works)
- [Government and private portal comparison](#government-and-private-portal-comparison)
- [Illustrative net-proceeds example](#illustrative-net-proceeds-example)
- [Implementation status](#implementation-status)
- [Architecture and data storage](#architecture-and-data-storage)
- [Technology stack](#technology-stack)
- [Run locally](#run-locally)
- [Demo walkthrough](#demo-walkthrough)
- [Screenshots](#screenshots)
- [Testing and validation](#testing-and-validation)
- [Assumptions, limitations and safety](#assumptions-limitations-and-safety)
- [Roadmap](#roadmap)
- [Problem statement alignment](#problem-statement-alignment)
- [Project documentation](#project-documentation)

## The problem

A market's headline price does not tell a farmer how much money may remain after the sale and delivery. A distant buyer may offer more per kilogram, but transport, handling, market fees, waiting time and deterioration may reduce the final return.

KhetSe focuses on three connected decisions:

1. **Where should I consider selling?** Compare modeled offers and relevant costs instead of ranking options by headline price alone.
2. **Can this delivery plan work?** Consider modeled route, capacity, timing and receiving constraints before treating an option as feasible.
3. **What if the plan is disrupted?** Compare a possible recovery action with a no-action baseline, including the modeled trade-offs, before an authorized person approves a capacity-changing action.

Transit and quality matter for perishable produce, but KhetSe's current quality curves are **assumptions for scenario comparison**, not scientifically validated predictions for a real crop or shipment.

### Current demo scenario

The repository's canonical fixture uses **10,000 kg of “Nashik Red Onion” from Pimpalgaon Baswant, Maharashtra**. The crop label and operational inputs belong to a simulated scenario; they are not a verified commercial shipment. The intended product is crop-agnostic. Tomatoes in Andhra Pradesh may be used in a future demonstration, but they are **not** the current canonical repository fixture.

## What KhetSe does

KhetSe is organized around three pillars.

### 1. Decide — compare estimated net proceeds

The planning experience compares modeled selling options using a consistent quantity and unit basis. Depending on the option, the comparison can include offer price, estimated saleable quantity, transport, handling and applicable fees.

The aim is to explain _why_ one modeled option may be better than another—not to present an estimate as a guaranteed payout.

### 2. Deliver — keep the simple path simple

The intended experience starts with harvest intake and a market/plan comparison. A nearby or straightforward sale should not require the farmer to navigate every logistics feature. A coordinated route can introduce capacity reservation and shipment checkpoints when needed.

In the current repository, harvest planning and database-backed reservations/shipment APIs are separate implementation paths. Viewing a plan does not book a buyer or reserve transport capacity.

### 3. Recover — compare options before acting

The incident demonstration compares a modeled recovery scenario with a no-action baseline. No action means continuing under the defined scenario assumptions; it does not automatically mean abandoning the produce.

A capacity-changing recovery requires explicit human approval and a successfully committed linked reservation swap. The current incident demo, normal shipment APIs and in-memory Simulation Lab are distinct paths rather than one integrated operational workflow.

## How the workflow works

The diagram shows the **intended product journey**, not a claim that every step is already integrated in the current application.

```mermaid
flowchart TD
    A[Harvest intake] --> B[Compare markets and buyers]
    B --> C[Estimate net proceeds]
    C --> D[Check route and capacity feasibility]
    D --> E{Farmer selects an option}
    E -->|Nearby / simple sale| F[Show clear comparison and next steps]
    E -->|Coordinated route| G[Request capacity reservation]
    G --> H[Record shipment checkpoints]
    H --> I{Disruption?}
    I -->|No| J[Review shipment status]
    I -->|Yes| K[Compare recovery with no action]
    K --> L[Human review and approval]
    L --> M[Execute only if requirements are met]
```

**What this means in practice:** KhetSe is intended to help with a decision before dispatch and a second decision if the delivery plan goes wrong. It is not currently a live exchange, a buyer marketplace, or an automated logistics operator.

## Government and private portal comparison

KhetSe is intended to **complement existing agricultural platforms**, not replace them. The platforms below already provide important services. The comparison describes their publicly presented focus and the proposed role of KhetSe; it is not a complete audit of each platform's features.

| Platform                                                                           | Publicly described focus                                                                                                                                                                                                                                                                                                        | Proposed KhetSe contribution                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [AGMARKNET](https://agmarknet.gov.in/) — Government of India                       | Mandi market information, including prices and arrivals. See the [government description](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2204750&lang=1&reg=3).                                                                                                                                                              | Add a modeled comparison of selected offers after estimated transport, handling/fees and saleable quantity. **KhetSe does not currently fetch AGMARKNET data.**                                             |
| [e-NAM](https://enam.gov.in/) — Government of India                                | Electronic agricultural trading and price discovery; its Platform of Platforms connects users to allied services such as logistics and warehousing. See the [official platform](https://enam.gov.in/) and [government description of PoP](https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=158169&lang=1&reg=22). | Demonstrate a transparent net-proceeds model and a recovery-versus-no-action comparison under stated assumptions. This does **not** imply e-NAM lacks logistics or allied services.                         |
| [Kisan Sarathi](https://kisansarathi.in/) — Government-supported advisory platform | Farmer-to-expert communication and access to localized agricultural advisories and market-rate information. See the [government description](https://www.pib.gov.in/FactsheetDetails.aspx?Id=150641&lang=3&reg=3).                                                                                                              | Focus on the specific post-harvest question: “Which option may leave me with more after modeled costs?” KhetSe does not currently integrate Kisan Sarathi.                                                  |
| [DeHaat](https://dehaat.in/) — Private agritech platform                           | A broad set of farmer services, including inputs, advisory, financial services and market linkages. See the [company website](https://dehaat.in/en?tab=1).                                                                                                                                                                      | Prototype an inspectable net-proceeds comparison and modeled disruption workflow as complementary decision support. KhetSe does not claim DeHaat lacks these or related capabilities.                       |
| [Ninjacart](https://ninjacart.com/) — Private agri supply-chain platform           | Fresh-produce market linkage, sourcing, inventory and supply-chain operations. See the [company website](https://ninjacart.com/).                                                                                                                                                                                               | Demonstrate farmer-side comparison of modeled selling outcomes and recovery trade-offs. KhetSe is not a marketplace or operating logistics network and does not claim to outperform Ninjacart's operations. |

### The gap KhetSe is trying to address

The proposed differentiation is the **combination and framing** of these decisions:

- **Headline price → estimated net proceeds:** include modeled delivery costs and estimated saleable quantity.
- **Visible assumptions:** make it possible to inspect which prices, costs and deterioration assumptions influence the comparison.
- **A simpler farmer journey:** keep the basic selling comparison short and introduce coordination steps only when needed.
- **A disruption decision:** compare a candidate recovery action with a no-action baseline before approval.
- **Honest uncertainty:** distinguish modeled estimates from current market data and real shipment telemetry.

We have **not** completed a feature-by-feature audit of the platforms above. Their services may overlap with some of KhetSe's intended features, so this README does not claim that any named platform lacks net-return tools, logistics integrations, quality services or disruption handling. Whether KhetSe is meaningfully distinct from every existing platform still needs fuller competitor research and farmer/user validation.

**Current integration boundary:** KhetSe does not currently ingest live prices from AGMARKNET/e-NAM, book transport through third-party platforms, connect to private buyer networks, or receive GPS/sensor telemetry. Current comparisons and recovery scenarios are synthetic or modeled.

## Illustrative net-proceeds example

This small example explains the calculation, not the current repository's canonical onion scenario. All values below are **synthetic assumptions**, not live market prices or measured field results. Example lot: 1,000 kg of tomatoes.

| Line item                     | Nearby mandi (20 km) | Distant buyer (400 km) |
| ----------------------------- | -------------------: | ---------------------: |
| Headline offer                |               ₹14/kg |                 ₹19/kg |
| Starting quantity             |             1,000 kg |               1,000 kg |
| Assumed transit deterioration |                   2% |                    10% |
| Estimated saleable quantity   |               980 kg |                 900 kg |
| Expected revenue              |              ₹13,720 |                ₹17,100 |
| Freight assumption            |                 ₹600 |                 ₹4,800 |
| Handling / fee assumption     |                 ₹690 |                   ₹900 |
| **Illustrative net proceeds** |          **₹12,430** |            **₹11,400** |

Here, the distant offer is ₹5/kg higher but leaves ₹1,030 less in estimated net proceeds under the stated assumptions. The result changes if the offer, costs, quality or transit assumptions change.

```text
Estimated net proceeds
  = expected revenue on estimated saleable quantity
  - transport cost
  - handling and applicable fees
```

Avoid subtracting the same deterioration twice: if expected revenue already uses the estimated saleable quantity after deterioration, do not apply the same quantity loss again as a separate monetary penalty.

## Implementation status

The repository contains working components, but they do **not yet form one fully integrated end-to-end operational journey**.

| Capability                                             | Current status                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Farmer desk                                            | Implemented at `/farmer`. It prices the registered 10,000 kg Nashik Red Onion lot against Vashi, Pune, Surat, and a Pune premium buyer with the baseline calculator. Tomato and grape stay unpriced. Replay links reopen the same modeled figures and do not call the database. A generated report stays in the browser and does not create a shipment. |
| Harvest intake and plan comparison                     | Implemented as the recorded operations path, separate from the farmer preview. Harvest records use local JSON; plans are computed from a fixed catalog and modeled estimates.                                                                                                                                                                           |
| Capacity reservations                                  | Implemented behind PostgreSQL. Database-backed capacity checks and swaps require a configured database and applied schema.                                                                                                                                                                                                                              |
| Normal shipment lifecycle                              | Implemented in database-backed APIs. Confirmed reservations can start shipments and append chronological status events.                                                                                                                                                                                                                                 |
| Incident and recovery demo                             | Implemented for the simulated `demo-igatpuri` workflow; operational demo state uses local JSON. A capacity-changing recovery also needs a linked PostgreSQL reservation.                                                                                                                                                                                |
| Deterministic Simulation Lab                           | Implemented at `/simulation`. The control room reprices registered disruptions in memory. The virtual clock does not change those amounts. Neither writes a shipment or reservation.                                                                                                                                                                    |
| Shipment report                                        | Partial. `GET /api/reports/{id}` returns the persisted shipment status plus the canonical alternative-recovery versus no-action comparison. That comparison is not the farmer-desk preview and not a completed sale. Collection `GET` and `POST` return 501. `/reports/demo-igatpuri` explains that the JSON story has no stored row.                   |
| Scenario reset/replay                                  | Implemented for the demo baseline when PostgreSQL is configured. Replay returns a modeled outcome; it does not create a shipment.                                                                                                                                                                                                                       |
| Live market prices, GPS, sensor telemetry and payments | Not implemented.                                                                                                                                                                                                                                                                                                                                        |
| Unified harvest-to-recovery-to-final-audit journey     | Not yet implemented.                                                                                                                                                                                                                                                                                                                                    |

### Important implementation boundaries

- The farmer desk does not call reservation or shipment APIs. Opening harvest intake afterward does not copy the preview quote onto a shipment.
- The planning UI does not book a buyer or reserve capacity.
- The normal PostgreSQL shipment path and local Igatpuri incident UI are separate flows.
- The Igatpuri recovery screen's ₹3,180 is the ventilated truck's ₹2,800 dispatch plus ₹38/km for the 10 km hop into Nashik cold storage. It is not the full alternative-recovery net of ₹2,29,586.71.
- Report recovery/no-action figures are a canonical fixture comparison, not a reconstruction of the stored shipment's realized sale.
- The Simulation Lab's virtual clock is in-memory only.
- The repository has no configured authentication/authorization system and no checked-in Prisma migration directory or ready-to-run schema-bootstrap command. Do not expose mutation APIs publicly without adding and reviewing access controls.

## Architecture and data storage

KhetSe is **one Next.js application**, not a separate frontend connected to an independently deployed backend service. Next.js serves pages and route handlers in the same application. TypeScript modules handle validation, planning rules, recovery logic and simulation behavior.

```mermaid
flowchart TD
    A[Next.js App Router UI] --> B[Route handlers]
    B --> C[Zod request validation]
    C --> D[Planning and feasibility logic]
    C --> E[Reservation and shipment queries]
    D --> F[Local JSON harvest store]
    D --> G[Modeled net-proceeds estimates]
    E --> H[Prisma transactions]
    H --> I[(PostgreSQL)]
    A --> J[In-memory Simulation Lab]
    B --> K[Local incident/recovery demo]
    K --> L[Recovery decision and approval]
    L --> E
    B --> M[Limited shipment report]
```

### Where data is stored

| Storage                   | Used for                                                              | Important limitation                                                       |
| ------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Local JSON                | Harvest intake and the independent Igatpuri incident demo             | Not a production multi-user data store.                                    |
| PostgreSQL through Prisma | Capacity reservations and normal shipment records/events              | Requires database configuration and an initialized schema.                 |
| In memory                 | Farmer desk preview, Simulation Lab clock, and scenario controls      | A generated farmer report and a lab preview do not update saved shipments. |
| Tracked JSON fixtures     | Canonical simulated scenario inputs, assumptions and expected results | Fixture outputs are not live operational measurements.                     |

## Technology stack

| Layer              | Technology                                    | Role                                       |
| ------------------ | --------------------------------------------- | ------------------------------------------ |
| Application        | Next.js 15 App Router, React 19               | Pages and user interface                   |
| Styling            | Tailwind CSS 3.4                              | Responsive presentation                    |
| API and validation | Next.js route handlers, TypeScript 5.7, Zod 3 | Request validation and domain APIs         |
| Database           | PostgreSQL, Prisma 6                          | Capacity reservations and normal shipments |
| Testing            | Vitest 3, PGlite                              | Unit and database integration tests        |
| Tooling            | Node.js 20, npm, Prettier 3, ESLint 9         | Development and verification               |

## Run locally

### Requirements

- Node.js 20 (see `.nvmrc`)
- npm
- PostgreSQL only for database-backed reservation, normal-shipment, report retrieval and reset/replay routes

### 1. Install dependencies

Clone the repository and enter its directory:

```bash
git clone https://github.com/nikhi20-900/khetse.git
cd khetse
npm ci
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The server can start without PostgreSQL, but database-backed routes will return HTTP 503 until a reachable database and schema are configured. The harvest/planning and simulation paths have different storage behavior; see [Where data is stored](#where-data-is-stored).

### 3. Configure database-backed features (optional)

Copy the example environment file and set `DATABASE_URL` to a database you are allowed to use:

```bash
cp .env.example .env.local
npm run prisma:generate
```

The repository does not currently include a checked-in migration directory or a ready-to-run schema-bootstrap command. Apply the Prisma schema using the team's reviewed database workflow before relying on database-backed routes. Use a disposable database for rehearsals involving reset/replay: those actions can delete demo shipments, reservations and local demo files.

Never commit `.env.local`, database credentials or real operational data.

## Demo walkthrough

These steps describe the current code paths. The farmer desk is the selling preview. The later steps are the recorded operations path. They are not yet one persisted journey.

1. **Open the farmer desk** at `/farmer`. Choose Nashik Red Onion. Tomato and grape stay unsupported because they have no registered price. The map uses baseline mandi coordinates. A mandi choice ends after the modeled margin. The Pune premium buyer continues into a photo attachment, which is not graded, and registered cold-van checkpoints. A breakdown shows modeled alternatives and does not promise that the farmer avoids a loss. The generated report stays in the browser.
   Repeat the same figures without a database: `/farmer?replay=vashi-mandi` (net ₹2,58,428.17), `/farmer?replay=pune-premium` (net ₹2,29,586.71), and `/farmer?replay=breakdown` (repair delta ₹1,01,818.36, cold-room delta ₹1,44,330.67, no-action delta ₹0.00).
2. **Create a harvest** at `/harvests/new`. The canonical demo uses a 10,000 kg Nashik Red Onion lot from Pimpalgaon Baswant; grade and coordinates are simulated inputs. This does not copy a farmer-desk quote.
3. **Compare plans** at `/plans?harvestId=...`. The app shows feasible and rejected options. A plan is an estimate, not a confirmed booking. Planning-card assumptions are not always identical to the separate recovery baseline; the UI/docs identify this distinction.
4. **Create a reservation** at `/reservations/new` with PostgreSQL configured. This creates a database-backed capacity hold. A conflicting capacity request should be refused.
5. **Dispatch a shipment** after a hold is confirmed. The dispatch action calls `POST /api/shipments`; status transitions such as `IN_TRANSIT` and `DELIVERED` use `POST /api/shipments/{id}/transitions`.
6. **Inspect the disruption demo** at `/shipments/demo-igatpuri` and `/incidents/inc_demo_igatpuri`. This is a separate simulated story; it does not automatically alter a normal PostgreSQL shipment or its reservation.
7. **Compare recovery with no action** in the incident workflow. A capacity-changing action requires a named approver and the required confirmations, plus a valid linked PostgreSQL reservation. If the requirements are not met, the action is refused.
8. **Review the report** at `/reports/{shipmentId}`. The stored shipment status is read from the database; the financial recovery/no-action comparison comes from canonical simulated scenarios. It is not the farmer-desk report, a completed sale, or a shipment-specific reconstruction. `GET /api/reports` and `POST /api/reports` return HTTP 501. `/reports/demo-igatpuri` explains that this story id has no stored row.
9. **Use reset/replay carefully.** The report controls call `POST /api/scenarios`. Reset restores baseline capacity and deletes demo operational records; replay returns a fixture-model result and does not create a shipment. Farmer-desk replay links do not call this route.
10. **Explore the Simulation Lab** at `/simulation`. The control room reprices registered disruptions. The virtual clock does not change those amounts. Neither writes a shipment or reservation.

For exact assumptions, route definitions and expected fixture results, see [Demo flow](docs/demo-flow.md) and [Assumptions](docs/assumptions.md).

## Screenshots

These are from the running demonstration.

![Vashi mandi quote, with the schematic map and modeled net](docs/screenshots/farmer-desk-quote.png)

![In-browser preview report after the mandi choice](docs/screenshots/farmer-preview-report.png)

![Breakdown alternatives on the cold-van preview](docs/screenshots/farmer-desk-breakdown.png)

![Stored shipment report with persisted status DISPATCHED](docs/screenshots/shipment-report-status.png)

![Modeled recovery delta on the same stored shipment report](docs/screenshots/shipment-report.png)

The Vashi replay shows the modeled quote and says finishing it does not reserve a truck. The preview report says it is not a persisted shipment outcome. The breakdown replay shows repair net ₹1,87,074.40, cold room then Pune net ₹2,29,586.71, and no-action net ₹85,256.04. The stored report keeps status `DISPATCHED` separate from the modeled delta of ₹1,44,330.67.

## Testing and validation

Run checks from the repository root:

```bash
npm test
npm run type-check
npm run lint
npm run format:check
npm run build
npm run validate-scaffold
npm run demo
npm run docs:check
npm run prisma:generate
```

`npm test` runs the Vitest suite plus demo-fixture validation and documentation checks. The tests cover fixture assumptions, request validation, reservation/capacity behavior, shipment transitions and recovery comparisons; integration tests use PGlite. `npm run demo` prints canonical fixture outputs—it does not create a shipment or write to PostgreSQL.

CI currently permits the lint step to fail without failing the overall workflow. A green CI result should therefore not be interpreted as proof that lint passed.

The release check for the farmer-desk commit ran on Node 26.7.0. The README and CI specify Node 20, and that check was not repeated on Node 20. `npm run build` was verified in a separate copy. In a working checkout, `npm run build` and `npm run dev` share `.next`. Delete `.next` before starting the dev server after a build, or `/simulation` can return 500.

## Assumptions, limitations and safety

- **Synthetic inputs:** operational numbers, prices, locations, route weights, capacities, event times, temperature, fees, quality curves and outcomes are simulated fixtures.
- **No live price feed:** KhetSe does not currently fetch real-time mandi or buyer prices.
- **No live tracking:** simulated checkpoints are not GPS observations or sensor readings.
- **No validated shelf-life model:** deterioration parameters are assumptions used to exercise comparison logic.
- **Not farmer profit:** net-proceeds estimates may exclude cultivation costs, taxes, finance, packaging, disposal and other real costs.
- **No guaranteed outcome:** model outputs are not realized sales, guaranteed prices or promises of return.
- **Human authority:** the farmer/coordinator remains responsible for choosing a route and approving recovery actions.
- **Security boundary:** no authentication/authorization configuration is currently provided. Do not expose mutation APIs publicly without implementing and reviewing access controls.
- **Data hygiene:** keep environment files, credentials and private operational data out of version control.

The canonical scenario's detailed formulas, units, timing rules, quality assumptions and fixture outputs are documented in [Assumptions](docs/assumptions.md) and [Evidence Register](docs/evidence-register.md).

## Roadmap

These are proposed extensions, not completed features:

- Integrate verified market-price feeds with source, timestamp, unit and validity labels.
- Validate the net-proceeds comparison with farmers, transporters and buyers using observed costs and real-world decision scenarios.
- Explore shared transport pooling for Farmer Producer Organizations.
- Evaluate optional pre-dispatch photo-based quality checks against labelled inspection outcomes.
- Add local-language voice guidance and a QR-based produce passport.
- Connect plan selection, reservation, shipment status, recovery and a persisted shipment-specific report into one end-to-end journey.
- Add a reproducible database migration/seed workflow and authentication/authorization before public deployment.
- Add other crops only after documenting and validating crop-specific assumptions.

## Problem statement alignment

KhetSe is being developed for **IC26-01-10 — Open Agri-Innovation**, where teams define an agricultural problem and propose an original solution that improves a farm-to-market outcome.

| Objective                              | KhetSe response                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Improve a farm-to-market outcome       | Compare estimated net proceeds after modeled transport and handling costs.                                                         |
| Define a concrete agricultural problem | Address the difference between headline price and estimated net return, with delivery disruption as a second decision point.       |
| Propose an explainable solution        | Combine net-proceeds comparison, visible assumptions and recovery-versus-no-action comparison.                                     |
| Demonstrate a prototype                | Provide harvest/planning UI, capacity and shipment APIs, a separate recovery demo, a virtual simulation and limited report output. |

## Project documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data model and persistence](docs/DATA_MODEL.md)
- [API contracts](docs/API_CONTRACTS.md)
- [Assumptions](docs/assumptions.md)
- [Evidence and data provenance register](docs/evidence-register.md)
- [Demo walkthrough](docs/demo-flow.md)
- [Development plan](docs/development-plan.md)
- [Team responsibilities](docs/TEAM_RESPONSIBILITIES.md)
- [Issue backlog](docs/issue-backlog.md)

---

_KhetSe • IC26-01-10 Open Agri-Innovation — Protect harvest value from decision to delivery._
