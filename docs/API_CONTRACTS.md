# API Contracts & Interface Specification

> **Current Implementation Status**: All API endpoints currently return `HTTP 501 Not Implemented`.
> This document specifies the intended contract shapes, request payloads, response schemas, and error semantics for subsequent implementation across Issues #2 through #8.

---

## 1. Global Standards & Error Format

All error responses adhere to the standard RFC 7807 problem details structure:

```json
{
  "type": "https://khetse.org/errors/capacity-conflict",
  "title": "Capacity Allocation Conflict",
  "status": 409,
  "detail": "Requested 10,000 kg exceeds remaining capacity (4,200 kg) on selected transport slot.",
  "instance": "/api/reservations/req_928174"
}
```

---

## 2. API Endpoints

### 2.1 Harvest Intake API

#### `POST /api/harvests`

Registers a new harvest batch for logistics planning.

**Request Payload:**

```json
{
  "cropType": "Nashik Red Onion",
  "quantityKg": 10000.0,
  "originLocation": {
    "name": "Pimpalgaon Baswant, Nashik, Maharashtra",
    "latitude": 20.1764,
    "longitude": 73.9856
  },
  "harvestTimestamp": "2026-10-25T06:00:00Z",
  "declaredQualityGrade": "Grade A",
  "temperatureRequirementC": {
    "min": 15.0,
    "max": 25.0
  },
  "maxShelfLifeHours": 96.0
}
```

**Planned Response (`201 Created`):**

```json
{
  "harvestId": "harv_89a712bc",
  "status": "REGISTERED",
  "createdAt": "2026-10-25T06:05:00Z"
}
```

---

### 2.2 Logistics Plans & Feasibility API

#### `POST /api/plans`

Generates and ranks candidate logistics plans for a registered harvest.

**Request Payload:**

```json
{
  "harvestId": "harv_89a712bc"
}
```

**Planned Response (`200 OK`):**

```json
{
  "harvestId": "harv_89a712bc",
  "evaluatedCombinations": 6,
  "feasiblePlans": [
    {
      "planId": "plan_01_fastest",
      "marketDestination": "Vashi APMC, Mumbai",
      "transportMode": "Ventilated 10T Truck",
      "transitDurationHours": 6.5,
      "estimatedLogisticsCostInr": 18500.0,
      "expectedGrossProceedsInr": 280000.0,
      "expectedNetProceedsInr": 261500.0,
      "feasibility": {
        "isFeasible": true,
        "score": 0.94
      }
    },
    {
      "planId": "plan_02_cold_storage",
      "marketDestination": "Pune APMC (via Intermediate Cold Storage)",
      "transportMode": "Standard Truck + Cold Room",
      "transitDurationHours": 24.0,
      "estimatedLogisticsCostInr": 29000.0,
      "expectedGrossProceedsInr": 310000.0,
      "expectedNetProceedsInr": 281000.0,
      "feasibility": {
        "isFeasible": true,
        "score": 0.88
      }
    }
  ],
  "rejectedPlans": [
    {
      "planId": "plan_03_surat_open",
      "marketDestination": "Surat APMC",
      "transportMode": "Open 5T Pickup",
      "feasibility": {
        "isFeasible": false,
        "rejectionReason": "CAPACITY_MISMATCH: Harvest volume (10,000 kg) exceeds single-vehicle payload (5,000 kg)."
      }
    }
  ]
}
```

---

### 2.3 Capacity Reservations API

#### `POST /api/reservations`

Acquires atomic holds on transport and storage slots at the PostgreSQL database boundary.

**Request Payload:**

```json
{
  "planId": "plan_01_fastest",
  "allocatedKg": 10000.0,
  "lockDurationMinutes": 15
}
```

**Planned Response (`201 Created`):**

```json
{
  "reservationId": "res_3819fa2",
  "status": "CONFIRMED",
  "allocatedKg": 10000.0,
  "expiresAt": "2026-10-25T06:20:00Z"
}
```

**Conflict Response (`409 Conflict`):**

```json
{
  "error": "CAPACITY_EXCEEDED",
  "message": "Selected vehicle slot was claimed by a concurrent booking. Zero capacity available."
}
```

---

### 2.4 Shipment Lifecycle API

#### `POST /api/shipments`

Dispatches a confirmed reservation and begins tracking.

**Request Payload:**

```json
{
  "reservationId": "res_3819fa2",
  "dispatchedAt": "2026-10-25T07:00:00Z"
}
```

**Planned Response (`201 Created`):**

```json
{
  "shipmentId": "ship_98124b",
  "status": "DISPATCHED",
  "currentLocation": "Pimpalgaon Origin Hub",
  "milestoneEventsCount": 1
}
```

#### `GET /api/shipments/{id}`

Returns complete shipment status, current checkpoint, and event log history.

---

### 2.5 Incident & Recovery API

#### `POST /api/incidents`

Injects a simulated in-transit disruption (breakdown, delay) or submits a human-approved recovery decision.

**Request Payload (Approval Action):**

```json
{
  "incidentId": "inc_71829",
  "action": "APPROVE_RECOVERY_PLAN",
  "selectedRecoveryPlanId": "rec_reroute_nashik_storage",
  "approvedBy": "Harvest Coordinator (Person 1)",
  "approvalNotes": "Confirmed cold storage slot holds 10 MT capacity at Nashik Pre-Cooling Centre."
}
```

**Planned Response (`200 OK`):**

```json
{
  "incidentId": "inc_71829",
  "status": "APPROVED",
  "newShipmentStatus": "REROUTED",
  "atomicSwapExecuted": true,
  "auditRecordId": "aud_198274"
}
```

---

### 2.6 Post-Shipment Report API

#### `GET /api/reports/{id}`

Returns complete audit trail and counterfactual financial model comparison.

**Planned Response (`200 OK`):**

```json
{
  "reportId": "rep_5519",
  "shipmentId": "ship_98124b",
  "status": "COMPLETED",
  "isSimulatedData": true,
  "financialModel": {
    "recoveryBranch": {
      "deliveredKg": 9400.0,
      "grossProceedsInr": 263200.0,
      "logisticsCostInr": 28500.0,
      "netProceedsInr": 234700.0
    },
    "noActionBranch": {
      "deliveredKg": 4100.0,
      "grossProceedsInr": 82000.0,
      "logisticsCostInr": 18500.0,
      "netProceedsInr": 63500.0
    },
    "counterfactualDeltaInr": 171200.0
  }
}
```
