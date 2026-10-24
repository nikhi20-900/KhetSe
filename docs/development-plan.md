# KhetSe Phased Development Plan & Milestone Roadmap

> **Current Phase**: Phase 1 (Scaffold-Only Setup) &mdash; **Complete**. Application implementation proceeds sequentially across Milestones 1, 2, and 3.

---

## 1. Phased Delivery Roadmap

```mermaid
gantt
    title KhetSe Hackathon Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Scaffold
    Repository, Docs, CI & Placeholders :done, p1, 2026-10-24, 2026-10-24
    section Milestone 1: MVP Foundation
    Issue 1: Demo Crop & Evidence Register :active, m1_1, 2026-10-25, 2026-10-26
    Issue 2: Harvest Intake & Plan UI      :m1_2, 2026-10-25, 2026-10-27
    Issue 3: Transactional Capacity DB     :m1_3, 2026-10-26, 2026-10-28
    Issue 4: Shipment Lifecycle & Delivery :m1_4, 2026-10-27, 2026-10-29
    section Milestone 2: Simulated Operations
    Issue 5: Virtual Clock & Simulation    :m2_1, 2026-10-29, 2026-10-31
    Issue 6: Disruption Alerts & Recovery  :m2_2, 2026-10-30, 2026-11-01
    section Milestone 3: Measurement & Demo
    Issue 7: Counterfactual Financials     :m3_1, 2026-11-01, 2026-11-02
    Issue 8: Final Report & Demo Scenarios :m3_2, 2026-11-02, 2026-11-03
```

---

## 2. Milestone Breakdown & Delivery Gates

### Milestone 1: MVP Foundation

- **Target Deliverables:** Core data definitions, harvest intake flow, transactional capacity reservations, and normal delivery flow.
- **Issues Assigned:**
  - [Issue #1: Define demo crop, region, and evidence register](https://github.com/nikhi20-900/khetse/issues/1) (Person 3)
  - [Issue #2: Implement harvest intake and feasibility explanations](https://github.com/nikhi20-900/khetse/issues/2) (Person 1)
  - [Issue #3: Add transactional capacity reservations](https://github.com/nikhi20-900/khetse/issues/3) (Person 2)
  - [Issue #4: Build shipment lifecycle and normal delivery path](https://github.com/nikhi20-900/khetse/issues/4) (Person 2)
- **Exit Criteria Gate:**
  - Harvest batch can be submitted with valid Zod validation.
  - Feasible plans displayed with transparent rejection explanations.
  - Concurrent reservations cannot exceed available physical slots.
  - A shipment reaches DELIVERED status along the normal path with chronological event logs.

---

### Milestone 2: Simulated Operations

- **Target Deliverables:** Deterministic virtual-clock engine, priority event queue, simulated disruptions, and human-in-the-loop recovery.
- **Issues Assigned:**
  - [Issue #5: Implement deterministic simulation and event history](https://github.com/nikhi20-900/khetse/issues/5) (Person 3)
  - [Issue #6: Add disruption alerts and human-approved recovery](https://github.com/nikhi20-900/khetse/issues/6) (Person 1, Person 2, Person 3)
- **Exit Criteria Gate:**
  - Simulation runs deterministically from fixed PRNG seed with virtual clock controls.
  - Vehicle breakdown triggers immediate disruption banner and halts transit.
  - Feasible recovery plans and mandatory No-Action alternative are displayed.
  - System enforces explicit human approval before atomic reservation swap and rerouting.

---

### Milestone 3: Measurement & Demo

- **Target Deliverables:** Counterfactual financial model comparison, post-shipment audit report, CSV export, and resettable demo presets.
- **Issues Assigned:**
  - [Issue #7: Compare fair recovery and no-action outcomes](https://github.com/nikhi20-900/khetse/issues/7) (Person 3)
  - [Issue #8: Create shipment report, export, and resettable scenarios](https://github.com/nikhi20-900/khetse/issues/8) (Person 1, Person 2, Person 3)
- **Exit Criteria Gate:**
  - Mathematical counterfactual comparison accurately computes positive, zero, and negative deltas.
  - Post-shipment report summarizes harvest specs, timeline milestones, and audited decisions.
  - CSV export accurately matches on-screen data.
  - One-click scenario reset restores pristine database state for repeatable demonstrations.

---

## 3. Pull Request & Verification Process

1. All feature code must be developed on designated branches (`feat/*`).
2. Pull requests must link corresponding issue numbers and adhere to PR checklist.
3. Every PR must pass automated CI checks:
   - Prettier formatting check (`npm run format:check`)
   - TypeScript compilation check (`npm run type-check`)
   - Scaffold integrity check (`npm run validate-scaffold`)
   - Linter verification (`npm run lint`)
4. Peer review from at least one other team member is required prior to merge.
