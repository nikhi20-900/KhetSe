# API Contracts & Interface Specification

> **Current Implementation Status**: Harvest intake (`/api/harvests`), plan comparison (`/api/plans`), capacity reservations (`/api/reservations`), the normal shipment path (`/api/shipments`), incident approval (`POST /api/incidents`), and `GET /api/reports/{id}` are implemented. A reroute is recorded only after the PostgreSQL capacity swap commits. `GET /api/reports` and `POST /api/reports` still return `HTTP 501`. Scenario reset is not implemented.
> This document records the agreed request and response shapes. Where an implemented route differs from an earlier example, that section states the implemented behavior.

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

Starts a shipment from a confirmed, unexpired reservation and consumes that reservation in the same transaction. Capacity stays allocated. A reservation that is missing, expired, already shipped, or not `CONFIRMED` is rejected. `dispatchedAt` is optional. When it is present and not earlier than the booking event, the shipment is recorded as `BOOKED` and then `DISPATCHED`.

**Request Payload:**

```json
{
  "reservationId": "res_3819fa2",
  "dispatchedAt": "2026-10-25T07:00:00Z"
}
```

**Response (`201 Created`):**

```json
{
  "shipmentId": "ship_98124b",
  "status": "DISPATCHED",
  "currentLocation": "Pimpalgaon Baswant, Maharashtra",
  "milestoneEventsCount": 2,
  "reservationId": "res_3819fa2",
  "dispatchedAt": "2026-10-25T07:00:00.000Z",
  "deliveredAt": null,
  "events": [
    {
      "id": "evt_booked",
      "eventType": "BOOKED",
      "location": "Pimpalgaon Baswant, Maharashtra",
      "description": "Shipment booked against a confirmed capacity reservation.",
      "eventTime": "2026-10-25T06:59:00.000Z"
    },
    {
      "id": "evt_dispatched",
      "eventType": "DISPATCHED",
      "location": "Pimpalgaon Baswant, Maharashtra",
      "description": "Dispatched from Pimpalgaon Baswant, Maharashtra.",
      "eventTime": "2026-10-25T07:00:00.000Z"
    }
  ]
}
```

`currentLocation` is the simulated baseline node `Pimpalgaon Baswant, Maharashtra`. An earlier example used the placeholder `Pimpalgaon Origin Hub`; that name is not a baseline node and the API does not return it. The checkpoint is a recorded label, not a live GPS reading. Omitting `dispatchedAt` leaves the shipment `BOOKED` with one event. Invalid input and illegal transitions return `422` `application/problem+json`.

#### `POST /api/shipments/{id}/transitions`

Advances one step on the normal path: `BOOKED` → `DISPATCHED` → `IN_TRANSIT` → `DELIVERED`. Each call appends one event. Events are not updated or deleted. `occurredAt` must not precede the latest event. `IN_TRANSIT` and `DELIVERED` require `location`.

```json
{
  "status": "IN_TRANSIT",
  "occurredAt": "2026-10-25T09:00:00Z",
  "location": "Nashik transfer checkpoint (fictional)"
}
```

Skipping a step, moving backwards, or sending an earlier timestamp returns `422`.

#### `GET /api/shipments/{id}`

Returns the shipment status, current checkpoint, and event log in chronological order.

---

### 2.5 Incident & Recovery API

#### `POST /api/incidents`

A storage reroute is not marked executed until `swapReservation` commits. If that swap fails, the response is an error and the original reservation stays as it was. No action records the decision without a swap. The example response fields `atomicSwapExecuted` and `auditRecordId` are not returned; the route returns the incident state after a confirmed swap. Recovery mileage uses the ventilated truck rate in `data/demo-baseline.json` (₹38/km), not an older catalog rate.

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

Returns the envelope the report page parses. `shipmentId` and `status` come from the stored shipment. `isSimulatedData` is true. The financial model is the canonical `alternative-recovery` versus `no-action` result calculated from `data/demo-baseline.json`, including the ventilated truck rate of ₹38/km. Those amounts are modeled estimates, not a completed sale. A missing shipment returns `404`. `GET /api/reports` and `POST /api/reports` still return `HTTP 501`. Scenario reset and replay stay disabled because no scenario operation is defined.

**Response (`200 OK`):**

```json
{
  "reportId": "rep_ship_98124b",
  "shipmentId": "ship_98124b",
  "status": "DELIVERED",
  "isSimulatedData": true,
  "financialModel": {
    "recoveryBranch": {
      "deliveredKg": 0,
      "grossProceedsInr": 0,
      "logisticsCostInr": 0,
      "netProceedsInr": 0
    },
    "noActionBranch": {
      "deliveredKg": 0,
      "grossProceedsInr": 0,
      "logisticsCostInr": 0,
      "netProceedsInr": 0
    },
    "counterfactualDeltaInr": 0
  }
}
```

The zero amounts above show the field shape only. The live route fills them from the baseline calculator.
