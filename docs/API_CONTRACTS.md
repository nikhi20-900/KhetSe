# API contracts and implementation status

These contracts describe the current Next.js route handlers and their backing services. The application has no separate API service and no authentication or authorization. Database-backed routes require `DATABASE_URL` and an initialized PostgreSQL schema. Most implemented errors use `application/problem+json`; the report collection placeholders return ordinary JSON 501 responses.

Shared schemas are in [`lib/contracts/`](../lib/contracts/). Fields and behavior below are based on those schemas, route handlers, service/query code, and tests. The report API is intentionally incomplete; unavailable fields must not be inferred by clients.

## Endpoint summary

| Method and path                                                | Status                    | Storage / behavior                                                                                                         |
| -------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/harvests`                                            | Implemented               | Lists local JSON harvest records.                                                                                          |
| `POST /api/harvests`                                           | Implemented               | Validates and writes a local JSON harvest.                                                                                 |
| `GET /api/harvests/{id}`                                       | Implemented               | Reads one local JSON harvest.                                                                                              |
| `GET /api/plans?harvestId={id}`                                | Implemented               | Evaluates local harvest against the planning catalog.                                                                      |
| `POST /api/plans`                                              | Implemented               | Same evaluation using `{ "harvestId": "…" }`.                                                                              |
| `POST /api/reservations`                                       | Implemented               | PostgreSQL capacity reservation.                                                                                           |
| `GET /api/reservations/{id}` / `DELETE /api/reservations/{id}` | Implemented               | Read/cancel a PostgreSQL reservation.                                                                                      |
| `POST /api/reservations/{id}/swap`                             | Implemented               | Atomic PostgreSQL capacity swap.                                                                                           |
| `POST /api/shipments`                                          | Implemented               | Create from a confirmed, unexpired reservation.                                                                            |
| `GET /api/shipments/{id}`                                      | Implemented               | Read persisted shipment and ordered event log.                                                                             |
| `POST /api/shipments/{id}/transitions`                         | Implemented               | Append one normal shipment transition.                                                                                     |
| `GET /api/incidents?shipmentId={id}`                           | Implemented for demo ID   | Reads local Igatpuri operational state; default is `demo-igatpuri`.                                                        |
| `POST /api/incidents`                                          | Implemented for demo flow | Inject breakdown, reset demo shipment, or record a recovery decision. Capacity-changing recovery also requires PostgreSQL. |
| `GET /api/incidents/{id}`                                      | Implemented for demo ID   | Reads the local operations state for the current incident.                                                                 |
| `GET /api/reports/{id}`                                        | Partial                   | Requires a stored PostgreSQL shipment; returns a limited report envelope and canonical modeled financial comparison.       |
| `GET /api/reports` / `POST /api/reports`                       | Not implemented           | Both return HTTP 501 JSON.                                                                                                 |
| `POST /api/scenarios`                                          | Implemented               | PostgreSQL reset/replay of the demo baseline; replay calculates a fixture outcome but creates no shipment.                 |

No authentication is performed. Mutating endpoints should only be exposed in a trusted demo environment.

## Harvests and plans

### `GET /api/harvests`

Returns `200 { "harvests": RegisteredHarvest[] }`, newest first. The local file is `data/harvests.json` by default; `KHETSE_DATA_DIR` can override the directory. Missing/unreadable data is treated as an empty list by the store.

### `POST /api/harvests`

Accepts the `harvestIntakeFieldsSchema` fields:

```json
{
  "cropType": "Nashik Red Onion",
  "quantityKg": 10000,
  "originLocation": {
    "name": "Pimpalgaon Baswant",
    "latitude": 20.17,
    "longitude": 73.99
  },
  "harvestTimestamp": "2026-10-25T06:00:00+05:30",
  "declaredQualityGrade": "Grade A",
  "temperatureRequirementC": { "min": 15, "max": 25 },
  "maxShelfLifeHours": 96
}
```

`cropType` is trimmed and 1–80 characters; quantity must be finite, positive, and at most 100,000 kg; origin name is 3–160 characters and coordinates must be within latitude/longitude bounds; timestamp must include a timezone and be no more than seven days in the past or thirty days in the future; grade is Grade A/B/C; temperature bounds are between -5°C and 50°C with minimum below maximum; shelf life is positive and at most 2,880 hours. Success is `201` with `{ harvestId, status: "REGISTERED", createdAt }`. Invalid JSON is `400`; schema/time-window errors are `422` problem details.

### `GET /api/harvests/{id}`

Returns the full registered-harvest object (`200`) or `404` problem details. It reads local JSON, not Prisma.

### `GET /api/plans?harvestId={id}` and `POST /api/plans`

`POST` accepts `{ "harvestId": "non-empty string" }`; `GET` uses the same required value in the query string. Success is `200` with `harvestId` plus `estimateLabel`, evaluated count, feasible/rejected plan arrays, featured plan IDs, and an optional blocking reason. The evaluator applies the current fixed catalog and schedule/feasibility rules; all cost, proceeds, and time values are modeled estimates. Missing/malformed input is `422`, unknown local harvest is `404`. The endpoint does not reserve any capacity.

## Reservations

All reservation endpoints require a configured, reachable PostgreSQL database and the schema. Missing `DATABASE_URL` returns `503`. The create and swap paths use database transactions and row/advisory locking. An optional `Idempotency-Key` header is supported for create/swap operations.

### `POST /api/reservations`

Strict JSON body:

```json
{
  "planId": "plan_vashi_ventilated-10t",
  "allocatedKg": 10000,
  "lockDurationMinutes": 15,
  "transportSlotId": "ventilated-10t",
  "storageFacilityId": "nashik-demo-cold"
}
```

Only `planId`, `allocatedKg`, `lockDurationMinutes`, and optional slot/facility IDs are allowed. Weight must be positive and no more than 100,000 kg; lock must be an integer from 5 to 120 minutes. Success is `201` with the `ReservationResponse` in `reservation.contract.ts`: reservation ID/status, kilograms and allocated slots, expiration, selected resource IDs, requested plan key, and message. Malformed JSON is `400`; invalid body is `422`; missing resource is `404`; capacity/idempotency conflicts are `409`; unexpected transaction failure is `500`.

### `GET /api/reservations/{id}` and `DELETE /api/reservations/{id}`

Read returns the reservation response (`200`); delete cancels it and returns the resulting query response (`200`). A missing reservation/resource returns `404`; invalid lifecycle or capacity condition may return a `ReservationError` status (usually `409`); missing DB is `503`; unexpected failure is `500`. Cancellation updates capacity in the transaction.

### `POST /api/reservations/{id}/swap`

Strict body accepts optional nullable `transportSlotId` and/or `storageFacilityId`; at least one must name a resource. The existing reservation ID is in the path. On success returns the swapped reservation response (`200`). The swap and capacity updates occur in one transaction; a capacity conflict returns `409` and leaves the prior hold unchanged. Malformed JSON is `400`, schema errors `422`, missing DB `503`, missing resources `404`, unexpected failure `500`.

## Shipments

All normal shipment endpoints require PostgreSQL. Shipment events are queried in timestamp order; the query layer installs an append-only database trigger.

### `POST /api/shipments`

Strict body: `{ "reservationId": "…", "dispatchedAt": "optional timezone timestamp" }`. Only a confirmed, unexpired reservation with no existing shipment is accepted. Success is `201` with a `ShipmentResponse` (shipment ID/status/location, event count, reservation ID, dispatch/delivery timestamps, and event list). Without `dispatchedAt`, the status remains `BOOKED` with a booking event; when supplied, the route appends `DISPATCHED` if its timestamp is not before booking. The reservation is consumed in the same transaction. Malformed JSON is `400`, schema or transition validation `422`, missing reservation `404`, expired/already-used/capacity conflict `409`, missing DB `503`, unexpected failure `500`.

### `GET /api/shipments/{id}`

Returns the shipment and chronological event records (`200`); missing shipment is `404`, missing DB `503`, and unexpected read failure `500`.

### `POST /api/shipments/{id}/transitions`

Strict body is `{ "status": "DISPATCHED|IN_TRANSIT|DELIVERED", "occurredAt": "timezone timestamp", "location": "checkpoint" }`. The normal path allows one step at a time: `BOOKED → DISPATCHED → IN_TRANSIT → DELIVERED`. `location` is required except for `DISPATCHED` (which uses the configured dispatch location). Event time cannot precede the most recent event. Success returns the updated shipment (`200`) and appends an event; invalid status/body/order is `422`, unknown shipment `404`, missing DB `503`, unexpected error `500`. Disruption states are not part of this normal transition endpoint.

## Incidents and recovery

### `GET /api/incidents?shipmentId={id}`

Returns the local `OperationsState` (`200`). If omitted, `shipmentId` defaults to `demo-igatpuri`. Other shipment IDs return `404`. This state is not the PostgreSQL shipment record.

### `GET /api/incidents/{id}`

Returns the same demo operations state (`200`) only when the requested incident exists in the local store; otherwise `404`.

### `POST /api/incidents`

Dispatches by `action`:

- `{ "action": "INJECT_BREAKDOWN", "shipmentId": "demo-igatpuri" }` validates against `injectBreakdownSchema`, modifies local demo operations state, and returns it (`200`). Invalid input is `422`; other shipment IDs return `404`.
- `{ "action": "RESET_DEMO" }` resets the local operations state and returns it (`200`). This is the operational shipment demo reset, distinct from `POST /api/scenarios`.
- A recovery decision uses `recoveryDecisionSchema`: `incidentId`, `action` (`APPROVE_RECOVERY_PLAN` or `SELECT_NO_ACTION`), `selectedRecoveryPlanId`, `approvedBy`, `confirmDecision: true`, and optional `managerApprovedBy`/`approvalNotes`. The selected option must be feasible; decisions with changed receiving window/commercial terms require manager approval under the domain rules. No-action records a decision without a capacity swap. A capacity-changing recovery requires a linked PostgreSQL reservation; it is recorded only after the swap transaction commits. Invalid input is `422`; rejected/stale decisions or missing reservation conflicts are `409`; successful decision is `200`; unexpected failure is `500`.

Malformed JSON is `400`. The local store defaults to `data/operations.json` or `KHETSE_DATA_DIR`. This API does not provide real telematics or a general incident service.

## Reports and scenarios

### `GET /api/reports/{id}`

Requires PostgreSQL and a stored shipment. Returns `200` with the current `ShipmentReport`: `reportId` (derived as `rep_{shipmentId}`), `shipmentId`, persisted `status`, `isSimulatedData: true`, and `financialModel` containing `recoveryBranch`, `noActionBranch` (`deliveredKg`, `grossProceedsInr`, `logisticsCostInr`, `netProceedsInr`) and `counterfactualDeltaInr`. Financial branches are computed from the canonical synthetic reference scenarios; they are not shipment-specific realized transactions. Missing DB is `503`, missing shipment `404`, unexpected report error `500`.

The response does **not** currently include harvest details, selected plan, shipment events, incident history, recovery decisions, delivery receipt, or an aggregate persisted report. The UI labels those sections as unavailable. `GET /api/reports` and `POST /api/reports` both return `501` JSON with `statusCode`, `error`, `message`, and `scaffold` fields. They do not save reports.

### `POST /api/scenarios`

Requires PostgreSQL. Strict JSON uses `action: "reset" | "replay"`; replay also requires a `scenarioId` present in `data/demo-baseline.json`. Reset may omit `scenarioId`. Invalid JSON returns `400`, invalid/unknown command `422`, missing database `503`, operation failure `500`. Success is `200` with `{ action, restored: true, status: "SIMULATED", scenarioId, modeledOutcome }`. `modeledOutcome` is null for reset and has `saleableKg`, `grossProceedsInr`, `logisticsCostInr`, `netProceedsInr` for replay. Both restore capacity and clear demonstration shipment/reservation/idempotency records and local demo files. Replay calculates a fixture outcome; it does not create a shipment or execute real logistics. Success must only be reported after the API returns successfully.
