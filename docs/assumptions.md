# Assumptions, Demo Parameters & Evidence Register

> **Scientific Disclosure**: All demonstration figures and parameter tables in this document are explicitly classified as either **Empirical Benchmark** (with documented provenance) or **Simulated Demonstration Data** (synthetically modeled for testing).

---

## 1. Canonical Demo Parameters

### 1.1 Sample Crop & Harvest Profile

- **Crop Variety:** Nashik Red Onion (_Allium cepa_)
- **Regional Origin:** Pimpalgaon Baswant, Nashik District, Maharashtra (20.1764° N, 73.9856° E)
- **Harvest Batch Size:** 10 Metric Tonnes (10,000 kg) packed in 50 kg ventilated jute mesh bags (200 bags)
- **Harvest Timestamp:** 06:00 AM IST, Day 1
- **Initial Quality Grade:** Grade A (Bulb diameter 45–60 mm, cured outer skin, moisture content ~82%)
- **Baseline Perishability:**
  - Ambient Ventilated (24°C–32°C): 96 hours before Grade B transition (1.2% weight loss per 24 hours).
  - Controlled Cold Storage (0°C–2°C, 65%–70% RH): 120+ days.
  - Closed Unventilated Transit (>35°C): Accelerated decay (5.0% weight loss and black mold onset after 18 hours).

### 1.2 Destination Terminal Markets (APMCs)

| Market Destination           | Distance from Origin | Transit Window | Receiving Slot   | Indicative Benchmark Price (Grade A) | Data Classification |
| ---------------------------- | -------------------- | -------------- | ---------------- | ------------------------------------ | ------------------- |
| **Vashi APMC (Navi Mumbai)** | 195 km via NH160     | 5.5 – 6.5 hrs  | 02:00 – 06:00 AM | ₹28.00 / kg (₹28,000 / MT)           | Empirical Benchmark |
| **Pune APMC (Gultekdi)**     | 215 km via NH60      | 6.0 – 7.0 hrs  | 03:00 – 07:00 AM | ₹31.00 / kg (₹31,000 / MT)           | Empirical Benchmark |
| **Surat APMC (Gujarat)**     | 240 km via NH848     | 6.5 – 7.5 hrs  | 04:00 – 08:00 AM | ₹26.50 / kg (₹26,500 / MT)           | Empirical Benchmark |

### 1.3 Transport Options & Cost Structure

| Vehicle Profile           | Payload Capacity | Dispatch Base Cost | Per-Km Freight Rate | Thermal Compatibility    | Data Classification |
| ------------------------- | ---------------- | ------------------ | ------------------- | ------------------------ | ------------------- |
| **Standard 10-T Truck**   | 10,000 kg        | ₹3,500             | ₹65 / km            | Ambient Open Canvas      | Simulated Demo Data |
| **Ventilated 10-T Truck** | 10,000 kg        | ₹4,500             | ₹72 / km            | Ambient Forced Aeration  | Simulated Demo Data |
| **Insulated Reefer Van**  | 7,500 kg         | ₹8,000             | ₹110 / km           | Active Chill (2°C – 8°C) | Simulated Demo Data |

### 1.4 Intermediate Cold Storage Facilities

| Facility Name                      | Location           | Capacity | In-Transit Access Point | Daily Storage Rate | Data Classification |
| ---------------------------------- | ------------------ | -------- | ----------------------- | ------------------ | ------------------- |
| **Pimpalgaon Post-Harvest Centre** | Pimpalgaon Hub     | 50 MT    | Origin Gate             | ₹1.80 / kg / week  | Empirical Benchmark |
| **Nashik Agro-Precooling Hub**     | Ambad MIDC, Nashik | 25 MT    | Checkpoint 1 (km 32)    | ₹2.20 / kg / week  | Simulated Demo Data |
| **Igatpuri Rural Cold Store**      | Igatpuri Bypass    | 15 MT    | Checkpoint 2 (km 88)    | ₹2.50 / kg / week  | Simulated Demo Data |

---

## 2. Evidence & Data Provenance Register

| Parameter ID | Parameter Description                | Empirical Reference / Source                                       | Retrieval Date | Notes & Limitations                                          |
| ------------ | ------------------------------------ | ------------------------------------------------------------------ | -------------- | ------------------------------------------------------------ |
| `EVD-MKT-01` | Vashi APMC Onion Modal Price         | Agmarknet (Directorate of Marketing & Inspection, GoI)             | Oct 2026       | Seasonal modal average; actual auction bids fluctuate daily. |
| `EVD-TRN-01` | Pimpalgaon to Mumbai Freight         | Nashik District Goods Transport Association Tariff                 | Oct 2026       | Excludes toll charges and detention fees.                    |
| `EVD-PHY-01` | Onion Post-Harvest Respiration Curve | National Horticultural Research and Development Foundation (NHRDF) | Oct 2026       | Assumes properly cured rabi/kharif bulbs.                    |
| `SIM-VEH-01` | Vehicle Breakdown Frequency          | Synthetic Stochastic Model                                         | Internal       | Generated deterministically from fixed PRNG seed.            |
| `SIM-FIN-01` | Emergency Recovery Surcharge         | Synthetic Cost Model                                               | Internal       | Fixed ₹5,000 flat dispatch fee + reroute mileage.            |

---

## 3. Pre-Configured Demonstration Scenarios

1. **Scenario A — Normal Delivery Path (Happy Path):**
   - 10,000 kg dispatched via Ventilated 10-T Truck directly to Vashi APMC.
   - Transit duration: 6 hours. Zero incidents.
   - Arrival within primary auction slot (03:30 AM). 98.8% saleable fraction realized.
2. **Scenario B — In-Transit Breakdown with Cold Storage Reroute (Positive Recovery):**
   - Breakdown triggered at Checkpoint 2 (Igatpuri Ghat, km 88).
   - Recovery Plan Proposed: Offload to Igatpuri Rural Cold Store.
   - Human Sign-Off: Approved.
   - Result: 94% crop salvaged. Counterfactual delta vs. no-action baseline: **+₹171,200**.
3. **Scenario C — Transit Delay with No-Action Decision (Observed Spoilage):**
   - Road blockage delay of 22 hours on route to Surat APMC.
   - Human Sign-Off: No Action (user opts not to pay emergency rerouting fees).
   - Result: Significant thermal spoilage (saleable fraction drops to 41%). Validates honest modeling of inaction.
4. **Scenario D — Negative Recovery Scenario (Intervention Exceeds Salvage):**
   - Breakdown occurs 20 km from destination; remaining cargo value is low.
   - Recovery dispatch fee exceeds marginal salvage difference.
   - Counterfactual delta: **-₹4,200**. Validates that the platform does not artificially bias outcomes toward intervention.

---

## 4. Unsupported Claims & Architectural Guardrails

The KhetSe platform **strictly disclaims** and excludes the following capabilities:

- **No Guaranteed Prices:** No mechanism exists to guarantee APMC auction realization prices.
- **No Real GPS Telematics:** Vehicle locations are discrete simulated steps, not live satellite feeds.
- **No Automated Bio-Sensors:** Freshness is calculated from mathematical shelf-life decay models.
- **No Unverified Income Claims:** Outcomes are reported strictly as modeled counterfactual estimates.
