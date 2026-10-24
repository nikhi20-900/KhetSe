# KhetSe &mdash; Agricultural Harvest Logistics Coordination Platform

[![CI Status](https://github.com/nikhi20-900/khetse/actions/workflows/ci.yml/badge.svg)](https://github.com/nikhi20-900/khetse/actions/workflows/ci.yml)
[![Repository Status: Demo Foundation](https://img.shields.io/badge/Status-Demo--Foundation-amber.svg)](https://github.com/nikhi20-900/khetse)
[![License: Pending Decision](https://img.shields.io/badge/License-Pending%20Decision-lightgrey.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015-black.svg)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/Language-TypeScript%205-blue.svg)](https://www.typescriptlang.org/)

> **Implementation status**: Issue #1 now provides canonical simulated demo data, a source register, a reference calculator and regression tests. Application views, API business logic, database mutations and the production TypeScript simulation engine remain scaffold placeholders, tracked in Issues #2 through #8.

---

## Table of Contents

1. [Project Title & Concise Description](#1-project-title--concise-description)
2. [Problem Statement & Target Users](#2-problem-statement--target-users)
3. [Proposed Solution & End-to-End Workflow](#3-proposed-solution--end-to-end-workflow)
4. [Scope of the Hackathon MVP](#4-scope-of-the-hackathon-mvp)
5. [Explicit Out-of-Scope Features](#5-explicit-out-of-scope-features)
6. [Technology Stack](#6-technology-stack)
7. [Planned Architecture](#7-planned-architecture)
8. [Planned Directory Structure](#8-planned-directory-structure)
9. [Development Setup & Environment Variables](#9-development-setup--environment-variables)
10. [Installation & Run Commands](#10-installation--run-commands)
11. [Database Setup & Migration/Seed Commands](#11-database-setup--migrationseed-commands)
12. [Testing & Lint Commands](#12-testing--lint-commands)
13. [GitHub Issue & Branch Workflow](#13-github-issue--branch-workflow)
14. [Team Member Responsibilities](#14-team-member-responsibilities)
15. [Issue Backlog & Master Tracking](#15-issue-backlog--master-tracking)
16. [Demo Walkthrough](#16-demo-walkthrough)
17. [Assumptions & Limitations](#17-assumptions--limitations)
18. [Data Provenance & Simulated-Data Disclosure](#18-data-provenance--simulated-data-disclosure)
19. [Security & Privacy Considerations](#19-security--privacy-considerations)
20. [Current Implementation Status](#20-current-implementation-status)

---

## 1. Project Title & Concise Description

**KhetSe** (_"From the Field"_) is a software-only agricultural harvest logistics coordination platform that models, optimizes, and coordinates the high-risk journey of perishable crops from farm gate to terminal wholesale markets (APMCs).

By combining multi-modal feasibility checks, transactional capacity reservations, deterministic virtual-clock simulation, and human-approved disruption recovery, KhetSe demonstrates how logistical coordination minimizes post-harvest loss and evaluates true counterfactual financial outcomes under rigorous, shared assumptions.

---

## 2. Problem Statement & Target Users

### The Problem

KhetSe explores how dispatch coordination, market arrival windows and in-transit disruptions affect a modeled farm-to-market outcome. The demonstration uses explicitly simulated loss assumptions; it does not establish a measured regional or national loss rate.

When a disruption strikes midway through transit:

- Farmers and harvest dispatchers lack visibility into alternative routes or nearby cold-storage holding capacity.
- Panic distress sales roadside cause steep financial destruction.
- Existing tools either assume unrealistic high-tech telematics or present unsubstantiated claims of guaranteed market prices.

### Target Users

- **Harvest Coordinators & Farmer Producer Organizations (FPOs):** Managing aggregated farm-gate dispatches to regional terminal markets.
- **Agricultural Logistics Dispatchers:** Scheduling dedicated trucks, ventilated vehicles, and cold-room holding slots.
- **Wholesale Receiving Desk Managers:** Coordinating predictable receiving slots at Agricultural Produce Market Committees (APMCs).

---

## 3. Proposed Solution & End-to-End Workflow

KhetSe coordinates the post-harvest journey through an integrated nine-stage workflow:

```mermaid
flowchart LR
    S1["1. Intake"] --> S2["2. Feasibility"]
    S2 --> S3["3. Reservation"]
    S3 --> S4["4. Dispatch & Sim"]
    S4 --> S5["5. Disruption"]
    S5 --> S6["6. Recovery Options"]
    S6 --> S7["7. Human Sign-Off"]
    S7 --> S8["8. Counterfactual"]
    S8 --> S9["9. Post-Shipment Report"]
```

1. **Enter Harvest Details:** Register crop profile, quantity (kg), farm-gate origin, harvest timestamp, and declared quality grade.
2. **Compare Feasible Plans:** Evaluate candidate logistics combinations (transport mode, market destination, intermediate cold storage) with explicit, human-readable explanations for rejected options.
3. **Reserve Capacity:** Lock scarce transport vehicle and storage slots transactionally at the database boundary to eliminate double-booking.
4. **Dispatch & Track Simulated Shipment:** Advance the shipment along its route using a deterministic virtual-clock engine.
5. **Simulate In-Transit Disruption:** Inject controlled operational incidents (such as the baseline vehicle breakdown at the Nashik checkpoint).
6. **Present Recovery Options:** Evaluate feasible alternative recovery routes alongside a mandatory **No-Action Alternative**.
7. **Require Human Approval:** Strictly mandate human-in-the-loop sign-off before executing any commercial recovery swap.
8. **Compare Modeled Financial Outcomes:** Rigorously compare actual recovery outcomes against what would have occurred under inaction using identical simulation seeds.
9. **Generate Shipment Report & Export:** Output a comprehensive audit trail, itemized cost/revenue reconciliation, and exportable CSV dataset.

---

## 4. Scope of the Hackathon MVP

The hackathon MVP focuses strictly on software coordination and transparent modeling:

- A standardized reference scenario: **10 Metric Tonnes of Nashik Red Onions** moving from **Pimpalgaon Baswant to Vashi APMC / Pune APMC / Surat APMC**.
- Pure TypeScript feasibility and ranking rules.
- PostgreSQL transactional capacity locking using Prisma ORM.
- Deterministic virtual-clock simulation supporting reproducible playback from a fixed PRNG seed.
- Human-in-the-loop recovery approval workflow with atomic reservation swapping.
- Objective counterfactual financial model supporting positive, neutral, and negative intervention deltas.
- Pre-configured resettable demonstration presets.

---

## 5. Explicit Out-of-Scope Features

To maintain scientific integrity and engineering realism, the following items are strictly out of scope:

- **No Physical GPS Tracking:** Locations are evaluated via discrete simulated checkpoints, not live telematics or satellite feeds.
- **No Guaranteed Minimum Prices:** Realization prices are fixed, explicitly simulated assumptions; no historical calibration or algorithmic market forecast is claimed.
- **No Automated Freshness Bio-Sensors:** Shelf-life decay is mathematically modeled from time and ambient temperature curves, not physical chemical probes.
- **No Direct Payments Processing:** Banking rails, payment gateway integrations, and escrow contracts are omitted.
- **No Unilateral Automated Commits:** Autonomous AI agents committing financial contracts without human approval are prohibited.
- **No Unsubstantiated Income Claims:** Outcomes are explicitly reported as modeled estimates, not guaranteed farmer income increases.

---

## 6. Technology Stack

| Layer                  | Technology                                            | Version   | Purpose                                                      |
| ---------------------- | ----------------------------------------------------- | --------- | ------------------------------------------------------------ |
| **Frontend Framework** | [Next.js](https://nextjs.org/) App Router             | `^15.1.7` | Server-rendered pages, client layouts, dynamic routing       |
| **UI Library**         | [React](https://react.dev/)                           | `^19.0.0` | Declarative component UI                                     |
| **Styling**            | [Tailwind CSS](https://tailwindcss.com/)              | `^3.4.17` | Utility-first styling with design system tokens              |
| **Language**           | [TypeScript](https://www.typescriptlang.org/)         | `^5.7.3`  | Strict static typing and contract enforcement                |
| **Database**           | [PostgreSQL](https://www.postgresql.org/)             | 16+       | Relational persistence with transaction isolation            |
| **ORM**                | [Prisma ORM](https://www.prisma.io/)                  | `^6.4.1`  | Type-safe schema definition, migrations, and queries         |
| **Validation**         | [Zod](https://zod.dev/)                               | `^3.24.2` | Runtime schema validation for forms and API contracts        |
| **Unit Testing**       | [Vitest](https://vitest.dev/)                         | `^3.0.5`  | Fast, deterministic unit and domain test runner              |
| **CI / Automation**    | [GitHub Actions](https://github.com/features/actions) | v4        | Automated formatting, type checking, and scaffold validation |

---

## 7. Planned Architecture

```mermaid
flowchart TD
    subgraph UI ["Frontend (Next.js 15 App Router)"]
        P1["app/harvests/new/page.tsx"]
        P2["app/plans/page.tsx"]
        P3["app/shipments/[id]/page.tsx"]
        P4["app/incidents/[id]/page.tsx"]
        P5["app/reports/[id]/page.tsx"]
    end

    subgraph API ["API & Persistence (Next.js Routes + Prisma)"]
        R1["app/api/harvests/route.ts"]
        R2["app/api/plans/route.ts"]
        R3["app/api/reservations/route.ts"]
        R4["app/api/shipments/route.ts"]
        R5["app/api/incidents/route.ts"]
        R6["app/api/reports/route.ts"]
        DB[("PostgreSQL Database")]
    end

    subgraph Domain ["Pure Domain & Simulation Engine"]
        D1["feasibility.ts"]
        D2["booking.ts"]
        D3["state-machine.ts"]
        D4["simulation.ts"]
        D5["financials.ts"]
        D6["counterfactual.ts"]
    end

    UI --> API
    API <--> DB
    API <--> Domain
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architectural documentation.

---

## 8. Planned Directory Structure

```text
khetse/
├── app/
│   ├── layout.tsx                     # Root shell, header, footer
│   ├── page.tsx                       # Landing page & scaffold notice
│   ├── globals.css                    # Tailwind CSS imports & theme variables
│   ├── harvests/
│   │   └── new/
│   │       └── page.tsx               # Harvest registration UI (Placeholder)
│   ├── plans/
│   │   └── page.tsx                   # Logistics plan comparison UI (Placeholder)
│   ├── shipments/
│   │   └── [id]/
│   │       └── page.tsx               # Shipment tracking & timeline (Placeholder)
│   ├── incidents/
│   │   └── [id]/
│   │       └── page.tsx               # Disruption alert & recovery modal (Placeholder)
│   ├── reports/
│   │   └── [id]/
│   │       └── page.tsx               # Post-shipment evaluation report (Placeholder)
│   └── api/
│       ├── harvests/
│       │   └── route.ts               # Harvest intake API (501 Not Implemented)
│       ├── plans/
│       │   └── route.ts               # Plan generation API (501 Not Implemented)
│       ├── reservations/
│       │   └── route.ts               # Capacity reservation API (501 Not Implemented)
│       ├── shipments/
│       │   └── route.ts               # Shipment lifecycle API (501 Not Implemented)
│       ├── incidents/
│       │   └── route.ts               # Incident & recovery API (501 Not Implemented)
│       └── reports/
│           └── route.ts               # Shipment report API (501 Not Implemented)
├── components/
│   ├── layout/README.md               # Layout shell components roadmap
│   ├── harvest/README.md              # Harvest intake components roadmap
│   ├── planning/README.md             # Plan comparison components roadmap
│   ├── shipments/README.md            # Shipment tracking components roadmap
│   ├── incidents/README.md            # Incident & recovery components roadmap
│   ├── reports/README.md              # Report & export components roadmap
│   └── ui/README.md                   # Reusable UI primitives roadmap
├── lib/
│   ├── contracts/
│   │   └── README.md                  # Shared Zod schemas & contract roadmap
│   ├── db/
│   │   └── README.md                  # Database client & transaction helpers
│   └── domain/
│       ├── README.md                  # Domain logic & simulation overview
│       ├── feasibility.ts             # Feasibility rules & ranking specification
│       ├── booking.ts                 # Reservation invariants specification
│       ├── state-machine.ts           # Shipment state machine specification
│       ├── simulation.ts              # Virtual clock & discrete queue specification
│       ├── financials.ts              # Financial proceeds & cost model specification
│       └── counterfactual.ts          # Comparative A/B branch evaluation specification
├── prisma/
│   ├── schema.prisma                  # PostgreSQL schema definition
│   └── seed.ts                        # Seed script placeholder
├── tests/
│   ├── unit/
│   │   └── README.md                  # Unit test plan roadmap
│   ├── integration/
│   │   └── README.md                  # Integration & concurrency test plan
│   └── scenarios/
│       └── README.md                  # E2E deterministic scenario test plan
├── docs/
│   ├── ARCHITECTURE.md                # System architecture documentation
│   ├── TEAM_RESPONSIBILITIES.md       # Team functional roles & file ownership
│   ├── API_CONTRACTS.md               # Endpoint shapes & request/response schemas
│   ├── DATA_MODEL.md                  # Entity relationship model & invariants
│   ├── assumptions.md                 # Demo parameters & evidence register
│   ├── development-plan.md            # Phased implementation roadmap
│   ├── issue-backlog.md               # GitHub issue tracking register
│   └── demo-flow.md                   # 10-step demonstration walkthrough script
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature_request.md         # Standard feature request template
│   │   └── bug_report.md              # Standard bug report template
│   ├── workflows/
│   │   └── ci.yml                     # Continuous integration workflow
│   └── pull_request_template.md       # Standard pull request checklist
├── .env.example                       # Example environment variables
├── .gitignore                         # Git ignore configuration
├── .nvmrc                             # Node.js version lock (v20)
├── .prettierrc.json                   # Prettier code formatting rules
├── eslint.config.mjs                  # ESLint configuration
├── next.config.ts                     # Next.js configuration
├── package.json                       # Project dependencies & scripts
├── postcss.config.mjs                 # PostCSS Tailwind configuration
├── tailwind.config.ts                 # Tailwind CSS theme configuration
├── tsconfig.json                      # TypeScript strict compiler configuration
├── vitest.config.ts                   # Vitest test runner configuration
├── CONTRIBUTING.md                    # Contribution guidelines & branch rules
├── CODE_OF_CONDUCT.md                 # Contributor Covenant Code of Conduct
├── SECURITY.md                        # Security vulnerability reporting policy
├── LICENSE                            # Software license pending team decision
└── README.md                          # Master documentation
```

---

## 9. Development Setup & Environment Variables

### Prerequisites

- **Node.js:** `v20.x` or `v22.x` (enforced via `.nvmrc`)
- **npm:** `v10.x` or `v11.x`
- **PostgreSQL:** `v15+` running locally or via Docker

### Environment Configuration

Copy the example environment file to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your local PostgreSQL connection string:

```bash
# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# PostgreSQL Connection String (used by Prisma ORM)
DATABASE_URL="postgresql://khetse_user:khetse_password@localhost:5432/khetse_db?schema=public"

# Node Environment
NODE_ENV="development"
```

> **Security Reminder**: Never commit real database passwords, cloud tokens, or secret keys to version control.

---

## 10. Installation & Run Commands

```bash
# 1. Clone the repository
git clone https://github.com/nikhi20-900/khetse.git
cd khetse

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:3000
```

---

## 11. Database Setup & Migration/Seed Commands

```bash
# Generate Prisma Client types from schema
npm run prisma:generate

# Future migration command (once database is running):
npx prisma migrate dev --name init_khetse_schema

# Future database seed command (populates baseline demo scenario):
npx prisma db seed
```

> **Note**: Database schema migrations and data seeding are pending execution in Milestone 1 ([Issue #3](https://github.com/nikhi20-900/khetse/issues/3)).

---

## 12. Testing & Lint Commands

After `npm ci`, the issue #1 fixtures can be inspected with `npm run demo`.
Edit `data/demo-baseline.json` or `data/evidence-register.json`, then run
`npm run docs:generate` and `npm test`. The reference scripts verify fixture
outcomes; they do not implement the application virtual clock or database APIs.

```bash
# Check code formatting with Prettier
npm run format:check

# Automatically format code
npm run format

# Run TypeScript compiler in strict type-check mode
npm run type-check

# Run Next.js linter
npm run lint

# Run Vitest baseline tests, fixture validation and documentation consistency checks
npm test

# Run scaffold structure and placeholder verification
npm run validate-scaffold
```

---

## 13. GitHub Issue & Branch Workflow

We follow a disciplined branch strategy to facilitate parallel, conflict-free collaboration:

### Branch Structure

- `main`: Protected, production-ready integration branch.
- `chore/project-scaffold`: Scaffold baseline and configuration changes.
- `feat/frontend-dashboard`: Frontend UI components and page layouts (Person 1).
- `feat/backend-api-db`: Backend API routes, Prisma schemas, and persistence (Person 2).
- `feat/domain-simulation`: Domain models, simulation engine, and test suites (Person 3).
- `integration/mvp`: Final end-to-end integration branch.

### Workflow Steps

1. Pull the latest `main` branch (`git checkout main && git pull origin main`).
2. Work strictly within assigned files according to role boundaries.
3. Verify local checks pass (`npm run type-check && npm run validate-scaffold`).
4. Open a Pull Request targeting `main` using the PR template.
5. Link the corresponding GitHub issue (e.g. `Closes #2`).
6. Merge only after peer review and green CI checks.

---

## 14. Team Member Responsibilities

Planned engineering ownership across the three team roles:

### Person 1 &mdash; Frontend and UX

- **Verified GitHub Account:** `nikhi20-900`
- **Ownership:** App layout, intake UI, plan comparison, shipment timeline, incident recovery prompts, and post-shipment report views.
- **Issues:** #2 (Lead), #6 (UI Lead), #8 (UI Lead).

### Person 2 &mdash; Backend and Database

- **GitHub Account:** _To be confirmed upon onboarding_
- **Ownership:** Next.js Route Handlers, PostgreSQL Prisma schema, transactional capacity reservations, shipment lifecycle persistence, and recovery swap transactions.
- **Issues:** #3 (Lead), #4 (Lead), #6 (API Lead), #8 (API Lead).

### Person 3 &mdash; Domain Logic, Simulation, and QA

- **GitHub Account:** _To be confirmed upon onboarding_
- **Ownership:** Feasibility rules, virtual-clock discrete event simulation, shipment state machine, financial proceeds calculations, counterfactual comparison engine, and test suites.
- **Issues:** #1 (Lead), #5 (Lead), #6 (Rules Lead), #7 (Lead), #8 (QA Lead).

See [docs/TEAM_RESPONSIBILITIES.md](docs/TEAM_RESPONSIBILITIES.md) for detailed role boundaries.

---

## 15. Issue Backlog & Master Tracking

All eight project issues have been formally created in the GitHub repository:

| #     | Issue Title                                              | Milestone            | Owner                    | Status                       | Link                                                 |
| ----- | -------------------------------------------------------- | -------------------- | ------------------------ | ---------------------------- | ---------------------------------------------------- |
| **1** | Define demo crop, region, and evidence register          | MVP Foundation       | Person 3                 | Implemented on domain branch | [#1](https://github.com/nikhi20-900/khetse/issues/1) |
| **2** | Implement harvest intake and feasibility explanations    | MVP Foundation       | Person 1 (`nikhi20-900`) | Planned                      | [#2](https://github.com/nikhi20-900/khetse/issues/2) |
| **3** | Add transactional capacity reservations                  | MVP Foundation       | Person 2                 | Planned                      | [#3](https://github.com/nikhi20-900/khetse/issues/3) |
| **4** | Build shipment lifecycle and normal delivery path        | MVP Foundation       | Person 2                 | Planned                      | [#4](https://github.com/nikhi20-900/khetse/issues/4) |
| **5** | Implement deterministic simulation and event history     | Simulated Operations | Person 3                 | Planned                      | [#5](https://github.com/nikhi20-900/khetse/issues/5) |
| **6** | Add disruption alerts and human-approved recovery        | Simulated Operations | Persons 1, 2, 3          | Planned                      | [#6](https://github.com/nikhi20-900/khetse/issues/6) |
| **7** | Compare fair recovery and no-action outcomes             | Measurement and Demo | Person 3                 | Planned                      | [#7](https://github.com/nikhi20-900/khetse/issues/7) |
| **8** | Create shipment report, export, and resettable scenarios | Measurement and Demo | Persons 1, 2, 3          | Planned                      | [#8](https://github.com/nikhi20-900/khetse/issues/8) |

See [docs/issue-backlog.md](docs/issue-backlog.md) for full descriptions and acceptance criteria.

---

## 16. Demo Walkthrough

The planned hackathon demo takes judges through a complete 10-step story:

1. **Intake:** Register 10 MT Nashik Red Onion harvest batch at Pimpalgaon Baswant.
2. **Comparison:** Contrast feasible routes vs. rejected plans with explicit constraint violations.
3. **Reservation:** Demonstrate transactional capacity locking at the PostgreSQL boundary.
4. **Dispatch:** Accelerate time through discrete checkpoints using the virtual clock.
5. **Disruption:** The primary vehicle breaks down at the simulated Nashik checkpoint.
6. **Options:** Compare a ventilated-truck transfer via the fictional Nashik cold room to Pune against waiting for repair and continuing to Vashi.
7. **Human Approval:** Harvest coordinator explicitly signs off on cold storage reroute.
8. **Arrival:** In the planned application, reserve recovery capacity atomically and complete the onward delivery.
9. **Financial Comparison:** Reproduce the generated outcome table in [docs/assumptions.md](docs/assumptions.md), including the negative recovery case.
10. **Export & Reset:** CSV export generated; database cleanly reset to baseline.

See [docs/demo-flow.md](docs/demo-flow.md) for presenter script notes.

---

## 17. Assumptions & Limitations

- **Perishability Curves:** Piecewise curves and environment multipliers are simulated fixtures, not fitted to empirical respiration studies.
- **Routes:** Distances, transit times and coordinates are fixed illustrative inputs, not verified road measurements.
- **Receiving Windows:** Daily unloading slots and detention rates are simulated reservations, not official APMC schedules or tariffs.
- **Prices and Recovery:** Fixed simulated prices support comparisons; outcomes are not guaranteed income or evidence that intervention is always beneficial.

See [docs/assumptions.md](docs/assumptions.md) for the complete parameter specification.

---

## 18. Data Provenance & Simulated-Data Disclosure

To avoid misleading users and judges, every figure in KhetSe is transparently classified:

- **Reference-Only Sources:** Official market pages support place names, and ICAR provides qualitative handling context. The [evidence register](docs/evidence-register.md) records URLs, retrieval dates, units and limitations. No empirical numerical benchmark calibrates this baseline.
- **Simulated Demonstration Data:** All operational values and scenario inputs are hand-authored, fixed and marked `SIMULATED`. The future application virtual clock and seeded PRNG remain unimplemented.
- **Labeling Standard:** All synthetic metrics and demo screens carry an explicit `SIMULATED` badge.

---

## 19. Security & Privacy Considerations

- **No Secrets in Repository:** Zero API credentials or database passwords committed to Git.
- **Input Sanitization:** All client inputs are rigorously validated through Zod schemas before reaching business logic.
- **Transactional Atomicity:** Database writes use row-level locking to prevent race conditions during concurrent capacity reservations.
- **Immutable Audit Trail:** Milestone events and human decisions are appended to an immutable audit log.
- **Vulnerability Reporting:** See [SECURITY.md](SECURITY.md) for disclosure guidelines.

---

## 20. Current Implementation Status

| Feature Area                    | Current Status                       | Next Action                            |
| ------------------------------- | ------------------------------------ | -------------------------------------- |
| Repository & CI                 | **Configured & Verified**            | Automated checks active                |
| Documentation & Specs           | **Complete**                         | Approved for sprint kickoff            |
| Page Views (`app/*`)            | **Placeholders (Scaffold)**          | Implement in Issues #2, #6, #8         |
| API Handlers (`app/api/*`)      | **501 Not Implemented**              | Implement in Issues #2, #3, #4, #6, #8 |
| Domain Modules (`lib/domain/*`) | **Specification Stubs**              | Implement in Issues #5, #7             |
| Database Schema                 | **Defined (`prisma/schema.prisma`)** | Migrate in Issue #3                    |
| Test Suites                     | **34 baseline regression checks**    | Add application tests in Issues #2-#8  |

_KhetSe &copy; 2026. Built for hackathon demonstration. Application features pending implementation._
