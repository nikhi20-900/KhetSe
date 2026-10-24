# GitHub Issue Backlog & Master Tracking Register

This document preserves the original scope and ownership for the eight tracked engineering issues in the **KhetSe** repository. Status below describes implementation visible on this branch, not the current GitHub open/closed or review state.

---

## Issue Summary Matrix

| #     | Title                                                    | Milestone            | Labels                                                                          | Owner                                           | Status                                                            | Issue Link                                           |
| ----- | -------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| **1** | Define demo crop, region, and evidence register          | MVP Foundation       | `documentation`, `domain-logic`, `simulation`, `priority:high`, `scaffold-only` | Person 3 (Domain/QA)                            | Implemented                                                       | [#1](https://github.com/nikhi20-900/khetse/issues/1) |
| **2** | Implement harvest intake and feasibility explanations    | MVP Foundation       | `frontend`, `enhancement`, `priority:high`                                      | Person 1 (`nikhi20-900`)                        | Implemented                                                       | [#2](https://github.com/nikhi20-900/khetse/issues/2) |
| **3** | Add transactional capacity reservations                  | MVP Foundation       | `backend`, `enhancement`, `priority:high`                                       | Person 2 (Backend/DB)                           | Implemented                                                       | [#3](https://github.com/nikhi20-900/khetse/issues/3) |
| **4** | Build shipment lifecycle and normal delivery path        | MVP Foundation       | `backend`, `enhancement`, `priority:high`                                       | Person 2 (Backend/DB)                           | Implemented in API/query layer                                    | [#4](https://github.com/nikhi20-900/khetse/issues/4) |
| **5** | Implement deterministic simulation and event history     | Simulated Operations | `domain-logic`, `simulation`, `testing`                                         | Person 3 (Domain/QA)                            | Implemented in isolated simulator                                 | [#5](https://github.com/nikhi20-900/khetse/issues/5) |
| **6** | Add disruption alerts and human-approved recovery        | Simulated Operations | `frontend`, `backend`, `domain-logic`, `integration`, `priority:high`           | Person 1 (UI), Person 2 (API), Person 3 (Rules) | Implemented for demo flow; DB swap is conditional                 | [#6](https://github.com/nikhi20-900/khetse/issues/6) |
| **7** | Compare fair recovery and no-action outcomes             | Measurement and Demo | `domain-logic`, `testing`, `documentation`                                      | Person 3 (Domain/QA)                            | Partial; fixture calculator only, domain modules are placeholders | [#7](https://github.com/nikhi20-900/khetse/issues/7) |
| **8** | Create shipment report, export, and resettable scenarios | Measurement and Demo | `frontend`, `backend`, `testing`, `integration`, `priority:high`                | Person 1 (UI), Person 2 (API), Person 3 (QA)    | Partial; report envelope and scenario controls/API exist          | [#8](https://github.com/nikhi20-900/khetse/issues/8) |

---

## Detailed Issue Specifications

### [Issue #1: Define demo crop, region, and evidence register](https://github.com/nikhi20-900/khetse/issues/1)

- **Milestone:** MVP Foundation
- **Owner:** Person 3 &mdash; Domain logic, simulation, and QA
- **Objective:** Establish canonical demo parameters, baseline crop profiles, geographic routing data, vehicle parameters, market destinations, and transparent evidence register.
- **Scope & Tasks:**
  - Select consistent sample crop (Nashik Red Onion), regional origin (Pimpalgaon Baswant, Maharashtra), harvest quantity (10 MT / 10,000 kg), harvest window, and initial grade/shelf-life decay curves.
  - Define primary and secondary destination terminal markets (Vashi APMC Mumbai, Pune APMC, Surat APMC), indicative market prices (INR/kg), transit windows, unloading slots, and detention penalties.
  - Define transport options (Standard 10-T truck, Ventilated truck, Reefer van), weight/volume capacities, fixed dispatch costs, per-km rates, and handling requirements.
  - Define intermediate/destination cold storage facilities, holding rates, and intake capacities.
  - Compile the Evidence & Data Provenance Register: record source name, retrieval date, unit of measurement, and empirical provenance for any referenced benchmark figures.
  - Explicitly flag synthetic/estimated numbers as "SIMULATED".
  - Define baseline reference scenarios: normal delivery, vehicle breakdown disruption, transit delay, alternative recovery route, no-action baseline, and negative-recovery outcome.
- **Acceptance Criteria:**
  - [ ] A documented demo scenario exists in `docs/assumptions.md` with explicit crop, origin, destination, and vehicle profiles.
  - [ ] Physical and financial units (kg, MT, INR, km, hours, °C) are standardized across the project.
  - [ ] Every external or empirical benchmark is registered in an Evidence Register with date, source, and methodology notes.
  - [ ] Synthetic parameters are unambiguously flagged as simulated demonstration data.
  - [ ] Unsupported real-world claims (e.g., live GPS tracking, guaranteed minimum realization, autonomous sensor validation) are excluded.

---

### [Issue #2: Implement harvest intake and feasibility explanations](https://github.com/nikhi20-900/khetse/issues/2)

- **Milestone:** MVP Foundation
- **Owner:** Person 1 &mdash; Frontend and UX (`nikhi20-900`)
- **Objective:** Build harvest intake workflow and plan comparison interface, displaying feasible market, transport, and storage plans alongside clear, specific rejection reasons for infeasible options.
- **Scope & Tasks:**
  - Build harvest intake page (`app/harvests/new/page.tsx`) capturing crop type, harvest volume (kg), origin location, harvest completion timestamp, declared quality grade, and temperature/handling requirements.
  - Implement client-side schema validation using Zod for mandatory fields, valid bounds, and logical date ranges.
  - Build plan comparison view (`app/plans/page.tsx`) displaying at least three feasible logistics combinations (Fastest Transit, Lowest Cost, Maximum Estimated Proceeds).
  - Present infeasible/rejected options with explicit, categorized reasons (e.g., Capacity Mismatch, Window Expired, Thermal Incompatibility).
  - Render transparent breakdown of estimated logistics costs (transport, handling, storage), expected gross proceeds, and estimated net returns.
  - Implement navigation contract to transition selected plan to capacity reservation.
- **Acceptance Criteria:**
  - [ ] Required fields and invalid values are handled with clear inline validation feedback.
  - [ ] At least three feasible demo plans can eventually be compared side-by-side.
  - [ ] Rejected options display understandable, specific constraint rejection reasons.
  - [ ] Selecting a plan leads to the planned booking and reservation workflow.
  - [ ] All financial and temporal estimates are explicitly labeled as modeled estimates.

---

### [Issue #3: Add transactional capacity reservations](https://github.com/nikhi20-900/khetse/issues/3)

- **Milestone:** MVP Foundation
- **Owner:** Person 2 &mdash; Backend and database
- **Objective:** Implement transactional, race-condition-free capacity reservation for transport slots and storage facilities at the PostgreSQL database boundary.
- **Scope & Tasks:**
  - Define PostgreSQL Prisma models for `Reservation`, `TransportSlot`, and `StorageFacility`.
  - Implement atomic capacity checks and reservation writes using PostgreSQL transactions (serializable/row-level locking `SELECT ... FOR UPDATE`).
  - Implement reservation lifecycle states (`PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `CONSUMED`) with automated time-to-live (TTL) expiration logic.
  - Implement atomic swap semantics for incident recovery: releasing old slot and claiming new slot within a single database transaction.
  - Define idempotent retry strategies and standard API error responses on concurrency conflict (HTTP 409 Conflict).
- **Acceptance Criteria:**
  - [ ] Capacity constraints are enforced strictly at the database boundary via transactions.
  - [ ] Concurrent booking cannot exceed available capacity under race conditions.
  - [ ] Failed recovery swap leaves the original reservation completely intact.
  - [ ] Cancellation and expiry update availability consistently in real time.
  - [ ] Concurrency and rollback tests verify transaction atomicity under simulated load.

---

### [Issue #4: Build shipment lifecycle and normal delivery path](https://github.com/nikhi20-900/khetse/issues/4)

- **Milestone:** MVP Foundation
- **Owner:** Person 2 &mdash; Backend and database
- **Objective:** Build the persistent shipment lifecycle state machine and complete happy-path dispatch-to-delivery event recording.
- **Scope & Tasks:**
  - Define shipment statuses (`BOOKED`, `DISPATCHED`, `IN_TRANSIT`, `DELIVERED`, `DISRUPTED`, `REROUTED`, `ABORTED`).
  - Implement API endpoints (`/api/shipments`, `/api/shipments/[id]`) for booking dispatch, checkpoint tracking, arrival, and delivery receipt.
  - Implement immutable event append log (`ShipmentEvent`) storing timestamp, location checkpoint, payload condition, and status transition.
  - Enforce valid state transitions and reject invalid transitions with detailed error contracts.
  - Expose shipment status and timeline through the API to feed the UI timeline and shipment report.
- **Acceptance Criteria:**
  - [ ] Valid state transitions work and append timestamped event logs.
  - [ ] Invalid state transitions (e.g., DELIVERED -> DISPATCHED) are rejected with HTTP 422 Unprocessable Entity.
  - [ ] Events are persisted immutably in strict chronological order.
  - [ ] A shipment reaches DELIVERED through the documented happy-path workflow.
  - [ ] Completion does not automatically imply unverified financial uplift.

---

### [Issue #5: Implement deterministic simulation and event history](https://github.com/nikhi20-900/khetse/issues/5)

- **Milestone:** Simulated Operations
- **Owner:** Person 3 &mdash; Domain logic, simulation, and QA
- **Objective:** Implement a deterministic simulation engine with virtual clock, discrete event queue, and reproducible disruption generation.
- **Scope & Tasks:**
  - Implement pure feasibility rules and ranking in `lib/domain/feasibility.ts`.
  - Define virtual clock abstraction (`virtualTime`, `timeScale`, `advanceTo`, `step`) in `lib/domain/simulation.ts`.
  - Implement priority event queue processing scheduled domain events (transit tick, checkpoint arrival, quality decay calculation).
  - Implement pseudo-random seed generator (PRNG) ensuring identical execution given identical initial state and seed.
  - Support delay and breakdown scenarios triggered at specific virtual times or geographic checkpoints.
  - Ensure idempotent event handling to prevent duplicate processing of ticks or duplicate event IDs.
  - Model crop degradation rate based on elapsed simulated time and transit vehicle environment.
- **Acceptance Criteria:**
  - [ ] Feasibility rules explain why options are rejected with machine-readable codes and clear descriptions.
  - [ ] Infeasible plans cannot be booked in simulation.
  - [ ] Identical seeds and user actions produce 100% bit-for-bit identical outcomes.
  - [ ] Duplicate event processing attempts do not duplicate side effects.
  - [ ] Unit tests cover normal, delayed, and disrupted scenario progressions.

---

### [Issue #6: Add disruption alerts and human-approved recovery](https://github.com/nikhi20-900/khetse/issues/6)

- **Milestone:** Simulated Operations
- **Owners:** Person 1 (UI), Person 2 (API), Person 3 (Rules)
- **Objective:** Implement disruption alert presentation, alternative recovery options calculation, atomic human approval, and auditable recovery execution.
- **Scope & Tasks:**
  - Present disruption alerts and shipment impact prominently on shipment view (`app/shipments/[id]/page.tsx` and `app/incidents/[id]/page.tsx`).
  - Offer feasible alternative recovery plans based on current location, remaining crop shelf-life, and nearby available capacity.
  - Always provide a no-action alternative (proceeding despite breakdown / distress liquidation at roadside).
  - Require explicit user approval before applying recovery; no unilateral execution.
  - Preserve capacity consistency during swaps: release abandoned reservation and secure new recovery capacity inside a single transactional boundary.
  - Record the decision and resulting state in an immutable audit log.
  - Require buyer/manager approval if commercial terms or receiving windows change.
- **Acceptance Criteria:**
  - [ ] Simulated incidents appear in the shipment timeline with clear visual urgency.
  - [ ] Recovery options obey capacity limits and crop handling rules.
  - [ ] No action alternative is always calculated and displayed.
  - [ ] Recovery requires explicit human approval before any state change.
  - [ ] Failed recovery swap does not corrupt or drop the existing booking.
  - [ ] Decisions and resulting state changes are fully auditable.

---

### [Issue #7: Compare fair recovery and no-action outcomes](https://github.com/nikhi20-900/khetse/issues/7)

- **Milestone:** Measurement and Demo
- **Owner:** Person 3 &mdash; Domain logic, simulation, and QA
- **Objective:** Build a rigorous counterfactual financial and quality comparison engine evaluating recovery vs. no-action outcomes under consistent assumptions.
- **Scope & Tasks:**
  - Freeze pre-incident baseline state (quantity, transit costs incurred so far, harvest time).
  - Evaluate recovery and no-action scenarios from comparable initial conditions.
  - Use a consistent simulation seed and shared assumptions across both paths.
  - Calculate modeled net sale proceeds: `Gross Proceeds = Quantity × Assumed Saleable Fraction × Expected Price`; `Net Proceeds = Gross Proceeds - (Initial Logistics Cost + Recovery Surcharge + Storage Fees)`.
  - Display itemized financial components and the net difference delta.
  - Explicitly support and display negative differences (where recovery intervention cost exceeds salvage value).
  - Explain uncertainty, model sensitivity, and excluded externalities.
- **Acceptance Criteria:**
  - [ ] Both scenarios share a strictly comparable pre-incident baseline.
  - [ ] Calculations are deterministic, unit-tested, and mathematically verified.
  - [ ] Positive, zero, and negative differences are supported without bias.
  - [ ] Financial components are shown separately as clear line items.
  - [ ] Results are described as modeled estimates, not proven income gains.

---

### [Issue #8: Create shipment report, export, and resettable scenarios](https://github.com/nikhi20-900/khetse/issues/8)

- **Milestone:** Measurement and Demo
- **Owners:** Person 1 (UI), Person 2 (API), Person 3 (QA)
- **Objective:** Deliver the final comprehensive post-shipment report with export functionality and resettable demo presets.
- **Scope & Tasks:**
  - Build the final shipment report view (`app/reports/[id]/page.tsx`).
  - Include harvest details, selected plan, shipment milestone events, incident logs, recovery decisions, delivery receipt, and counterfactual financial comparison.
  - Provide clean CSV and printable export formatting.
  - Create resettable demo scenarios restoring database state to known baseline conditions.
  - Verify normal-delivery, recovery, no-action, and negative-recovery flows.
  - Document the final demo script and presenter walkthrough in `docs/demo-flow.md`.
- **Acceptance Criteria:**
  - [ ] A completed or aborted shipment produces an accessible report.
  - [ ] Exported data matches the displayed report and includes disclaimer notice.
  - [ ] Resetting scenarios restores known starting conditions cleanly.
  - [ ] All four required demo flows (Normal, Recovery, No-Action, Negative Recovery) can be reproduced.
  - [ ] Simulated data and limitations are clearly disclosed throughout.
