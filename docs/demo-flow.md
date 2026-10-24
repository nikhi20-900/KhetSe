# KhetSe End-to-End Demonstration Script & Walkthrough

> **Demo Status**: Planned script for future evaluation once Milestones 1, 2, and 3 are delivered.
> In the current scaffold phase, UI views display placeholders and API routes return 501 Not Implemented.

---

## 1. Demo Narrative Arc

The KhetSe demo tells a realistic, evidence-grounded story of a perishable agricultural harvest under logistical risk:

1. **The Vulnerability:** 10 Metric Tonnes of freshly harvested Nashik Red Onions must travel from Pimpalgaon to a major terminal market before the arrival window closes.
2. **The Intelligence:** The platform evaluates routes, transport modes, and market prices, explaining why sub-optimal options are rejected.
3. **The Commitment:** Scarce physical capacity is transactionally locked without risk of double-booking.
4. **The Crisis:** Midway through transit (Igatpuri Ghat), the primary vehicle breaks down.
5. **The Human Decision:** Rather than automated black-box intervention, the platform computes trade-offs and requires human sign-off on a cold storage reroute vs. an unmitigated no-action baseline.
6. **The Proof:** Post-delivery, the platform proves the financial delta between intervention and inaction using identical simulation assumptions.

---

## 2. Step-by-Step Walkthrough Script

### Step 1: Harvest Registration (`/harvests/new`)

- **Presenter Action:** Open the Harvest Intake screen.
- **Narrative:** "We begin at the farm gate in Pimpalgaon Baswant. A harvest batch of 10,000 kg Nashik Red Onions has just been packed. We enter the harvest time (06:00 AM) and initial Grade A certification."
- **System Behavior:** Client-side Zod validation verifies that bounds, temperature constraints (15°C–25°C), and shelf-life horizons (96 hours) are satisfied.

### Step 2: Feasible Plan Comparison (`/plans`)

- **Presenter Action:** Submit intake and navigate to the Logistics Plan Comparison.
- **Narrative:** "Rather than guessing, KhetSe evaluates all available routes. Notice the top option: a Ventilated 10T truck directly to Vashi APMC Mumbai. But look below: an open 5T pickup to Surat is flagged as INFEASIBLE with the explicit reason: _Payload exceeds single vehicle capacity_."
- **Key Display:** Side-by-side cards comparing transit hours, logistics freight cost, and expected net proceeds.

### Step 3: Transactional Capacity Reservation

- **Presenter Action:** Click "Reserve Plan 1".
- **Narrative:** "Agricultural logistics fail when multiple parties book the same truck. Watch KhetSe acquire a transactional lock at the PostgreSQL boundary. This slot is held for 15 minutes while the dispatch is prepared."

### Step 4: Dispatch & Deterministic Simulation (`/shipments/{id}`)

- **Presenter Action:** Click "Dispatch Shipment" and observe the virtual clock stepper.
- **Narrative:** "The shipment departs at 07:00 AM. Using our virtual clock simulation engine, we accelerate time. The shipment passes Checkpoint 1 (Ambad MIDC) in pristine condition."

### Step 5: In-Transit Disruption (`/incidents/{id}`)

- **Presenter Action:** At virtual time 09:30 AM (Checkpoint 2, Igatpuri Ghat), the simulation injects a vehicle breakdown.
- **Narrative:** "A mechanical failure occurs on the ghats. Ambient temperature is 32°C. The clock is ticking against crop shelf-life. An instant alert triggers."
- **Key Display:** Disruption banner with remaining shelf-life countdown and impact assessment.

### Step 6: Dynamic Recovery vs. No-Action Alternative

- **Presenter Action:** Review the Recovery Options modal.
- **Narrative:** "KhetSe presents two clear options: Option A reroutes to the nearby Igatpuri Rural Cold Store (₹7,500 emergency transfer). Option B is No Action &mdash; staying roadside and facing distress liquidation. The system refuses to make an autonomous commercial decision; human approval is strictly required."

### Step 7: Human Approval & Atomic Swap

- **Presenter Action:** Select Option A (Cold Storage Reroute) and click "Approve Recovery".
- **Narrative:** "The coordinator confirms the reroute. Inside a single atomic database transaction, KhetSe releases the Vashi delivery slot and locks the cold storage bay. Zero orphaned reservations."

### Step 8: Rerouted Delivery Receipt

- **Presenter Action:** Advance simulation to arrival at Igatpuri Cold Store.
- **Narrative:** "Cargo arrives safely. 94% of bulb quality is preserved in climate-controlled storage until replacement transit is arranged."

### Step 9: Post-Shipment Audit Report & Counterfactual Comparison (`/reports/{id}`)

- **Presenter Action:** Open the final executive report.
- **Narrative:** "Here is the true value of KhetSe: an honest counterfactual financial comparison. Under our human-approved recovery, net proceeds were ₹234,700. Under the No-Action branch, spoilage reduced net realization to ₹63,500. The modeled counterfactual advantage is +₹171,200 &mdash; computed under identical seeds and market assumptions."
- **Key Display:** Transparent financial comparison table separating gross revenue, freight costs, emergency recovery fees, and spoilage losses.

### Step 10: Export & Resettable Scenarios

- **Presenter Action:** Click "Export CSV" and demonstrate "Reset to Baseline Demo".
- **Narrative:** "The complete audit trail is exportable. For judges and evaluators, one click resets the database back to known initial conditions, ready for testing other scenarios like our negative-recovery benchmark."
