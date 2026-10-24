# Team Roles & Engineering Responsibilities

This document defines the functional roles, planned ownership, and collaborative boundaries for the three-person engineering team building **KhetSe**.

> **Status**: These roles define ownership, not a completion checklist. Functional features are now implemented; see [the demo walkthrough](demo-flow.md) for the verified baseline and remaining integration boundaries.

**Next handoff:** Person 3 takes Issue #7 (fair counterfactual financials), with Person 2 reviewing persistence/report integration and joining the final live demo. Keep redesign `944f834` and stash `be6ac33` separate from functional work. The stash must be verified in its originating checkout.

---

## 1. Team Members & Functional Roles

### Person 1 — Frontend and UX

- **Verified GitHub Account:** `nikhi20-900`
- **Core Focus:** User experience, accessible interface design, stateful client workflows, and client-side validation.
- **Key Responsibilities:**
  - Application layout, shell, and responsive styling (`app/layout.tsx`, `app/globals.css`, `components/layout/`).
  - Harvest registration interface with Zod validation (`app/harvests/new/page.tsx`, `components/harvest/`).
  - Logistics plan comparison cards and rejection reason display (`app/plans/page.tsx`, `components/planning/`).
  - Shipment milestone progress stepper and event history timeline (`app/shipments/[id]/page.tsx`, `components/shipments/`).
  - Disruption alert banner, recovery option selection, and human approval modal (`app/incidents/[id]/page.tsx`, `components/incidents/`).
  - Post-shipment evaluation report layout and CSV export integration (`app/reports/[id]/page.tsx`, `components/reports/`).
  - Reusable design system primitives (`components/ui/`).
- **Primary Feature Branch:** `feat/frontend-dashboard`

---

### Person 2 — Backend and Database

- **GitHub Account:** _To be confirmed upon onboarding_ (do not invent username)
- **Core Focus:** API endpoint architecture, PostgreSQL persistence, transaction isolation, and capacity locking.
- **Key Responsibilities:**
  - Next.js Route Handlers (`app/api/*`).
  - PostgreSQL Prisma schema definition and migration scripts (`prisma/schema.prisma`).
  - Database client singleton, connection pooling, and transaction wrappers (`lib/db/*`).
  - Atomic capacity reservation engine preventing race conditions and double-booking (`app/api/reservations/route.ts`).
  - Shipment lifecycle persistence and immutable chronological event logging (`app/api/shipments/route.ts`).
  - Atomic recovery swap implementation releasing abandoned slots and acquiring new resources within a single database transaction (`app/api/incidents/route.ts`).
  - Post-shipment audit data aggregation and export endpoint (`app/api/reports/route.ts`).
- **Primary Feature Branch:** `feat/backend-api-db`

---

### Person 3 — Domain Logic, Simulation, and QA

- **GitHub Account:** _To be confirmed upon onboarding_ (do not invent username)
- **Core Focus:** Mathematical models, discrete event simulation, virtual clock mechanics, financial algorithms, and testing.
- **Key Responsibilities:**
  - Canonical demo parameters, crop degradation curves, and Evidence Register (`docs/assumptions.md`).
  - Pure feasibility rule evaluation and multi-objective plan ranking (`lib/domain/feasibility.ts`).
  - Deterministic virtual-clock engine with discrete priority event queue and seeded PRNG (`lib/domain/simulation.ts`).
  - Formal shipment lifecycle state machine definitions and guard invariants (`lib/domain/state-machine.ts`).
  - Capacity calculation and lock expiry logic (`lib/domain/booking.ts`).
  - Financial gross/net proceeds calculation and decay models (`lib/domain/financials.ts`).
  - Counterfactual branching engine evaluating recovery vs. no-action baseline under identical seeds (`lib/domain/counterfactual.ts`).
  - Test suites: pure unit tests, integration concurrency tests, and deterministic scenario tests (`tests/*`).
- **Primary Feature Branch:** `feat/domain-simulation`

---

## 2. Shared Ownership Matrix

| Feature / Artifact                 | Primary Lead  | Collaborator(s)                  | GitHub Issue |
| ---------------------------------- | ------------- | -------------------------------- | ------------ |
| Demo Data & Evidence Register      | Person 3      | Person 2                         | Issue #1     |
| Harvest Intake & Plan Comparison   | Person 1      | Person 2, Person 3               | Issue #2     |
| Transactional Capacity Locking     | Person 2      | Person 3                         | Issue #3     |
| Shipment Lifecycle & Normal Path   | Person 2      | Person 1, Person 3               | Issue #4     |
| Deterministic Virtual Simulation   | Person 3      | Person 2                         | Issue #5     |
| Disruption Alerts & Human Recovery | Person 1 (UI) | Person 2 (API), Person 3 (Rules) | Issue #6     |
| Fair Counterfactual Financials     | Person 3      | Person 1, Person 2               | Issue #7     |
| Final Report, Export & Scenarios   | Person 1 (UI) | Person 2 (API), Person 3 (QA)    | Issue #8     |

---

## 3. Collaboration & Communication Rules

1. **Strict File Boundaries:** Team members must avoid modifying files outside their planned ownership area to minimize merge conflicts.
2. **Contract-First Development:** API request/response shapes and Zod schemas in `lib/contracts` must be mutually agreed upon before implementing frontend consumers or backend producers.
3. **Branch Hygiene:** Feature branches must be rebased or merged with `main` frequently. Direct commits to `main` are disallowed; all code enters `main` via reviewed Pull Requests.
4. **Scaffold Integrity:** During the scaffold phase, no member shall commit mock implementations that pretend to calculate real values.
