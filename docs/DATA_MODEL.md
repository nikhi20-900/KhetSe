# Data Model & Entity Relationship Specification

> **Current Implementation Status**: The data model is formally defined in `prisma/schema.prisma` for PostgreSQL. Database migrations and live database persistence are pending execution under Issue #3 and #4.

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    HARVEST ||--o{ LOGISTICS_PLAN : generates
    HARVEST ||--o{ SHIPMENT : tracks
    LOGISTICS_PLAN ||--o{ RESERVATION : locks
    LOGISTICS_PLAN ||--o{ SHIPMENT : guides
    TRANSPORT_SLOT ||--o{ RESERVATION : allocates
    STORAGE_FACILITY ||--o{ RESERVATION : allocates
    RESERVATION ||--o{ SHIPMENT : secures
    SHIPMENT ||--o{ SHIPMENT_EVENT : appends
    SHIPMENT ||--o{ INCIDENT : experiences
    INCIDENT ||--o{ RECOVERY_DECISION : prompts
    SHIPMENT ||--o{ RECOVERY_DECISION : records
    SHIPMENT ||--o{ SHIPMENT_REPORT : summarizes

    HARVEST {
        string id PK
        string cropType
        float quantityKg
        string originLocation
        datetime harvestTimestamp
        string qualityGrade
    }

    LOGISTICS_PLAN {
        string id PK
        string harvestId FK
        string marketDestination
        string transportMode
        float estimatedCostInr
        float expectedGrossInr
        float expectedNetInr
        boolean isFeasible
        string rejectionReason
    }

    TRANSPORT_SLOT {
        string id PK
        string vehicleType
        float capacityKg
        float availableKg
        float costPerKmInr
        datetime departureWindow
    }

    STORAGE_FACILITY {
        string id PK
        string name
        int totalSlots
        int freeSlots
        float tempMinC
        float tempMaxC
        float dailyRateInr
    }

    RESERVATION {
        string id PK
        string planId FK
        string transportSlotId FK
        string storageFacilityId FK
        string status
        float allocatedKg
        datetime expiresAt
    }

    SHIPMENT {
        string id PK
        string harvestId FK
        string planId FK
        string reservationId FK
        string status
        string currentLocation
        datetime dispatchedAt
        datetime deliveredAt
    }

    SHIPMENT_EVENT {
        string id PK
        string shipmentId FK
        string eventType
        string locationTag
        datetime eventTime
        json payloadJson
    }

    INCIDENT {
        string id PK
        string shipmentId FK
        string incidentType
        string checkpoint
        datetime loggedAt
    }

    RECOVERY_DECISION {
        string id PK
        string shipmentId FK
        string incidentId FK
        string status
        string actionChosen
        string approvedBy
        datetime approvedAt
    }

    SHIPMENT_REPORT {
        string id PK
        string shipmentId FK
        float totalCostInr
        float grossRealizedInr
        float netModeledInr
        float counterfactualDelta
        boolean isSimulated
        json reportData
    }
```

---

## 2. Core Entities & Field Specifications

### 2.1 Harvest (`harvests`)

Represents the batch of harvested produce registered at the farm gate.

- `id` (UUID, Primary Key): Unique harvest identifier.
- `cropType` (String): Crop name (e.g., "Nashik Red Onion").
- `quantityKg` (Float): Total weight harvested in kilograms.
- `originLocation` (String): Origin market yard or farm coordinates.
- `harvestTimestamp` (DateTime): Time harvest was completed.
- `qualityGrade` (String): Declared initial quality grade.

### 2.2 LogisticsPlan (`logistics_plans`)

Represents an evaluated logistics combination of transport mode, intermediate storage, and terminal market destination.

- `id` (UUID, Primary Key): Unique plan identifier.
- `harvestId` (UUID, Foreign Key): Reference to parent harvest.
- `isFeasible` (Boolean): Feasibility flag evaluated against physical constraints.
- `rejectionReason` (String, Nullable): Human-readable reason if infeasible.
- `estimatedCostInr` (Float): Estimated logistics and handling expenses.

### 2.3 Reservation (`reservations`)

Transactional hold on transport vehicles and storage spaces.

- `id` (UUID, Primary Key): Reservation identifier.
- `status` (Enum): `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `CONSUMED`.
- `allocatedKg` (Float): Weight allocated to this reservation.
- `expiresAt` (DateTime): Automated timeout timestamp for pending holds.

### 2.4 Shipment & ShipmentEvent (`shipments`, `shipment_events`)

The state machine record and immutable chronological audit log of all transit milestones.

- `status` (Enum): `DRAFT`, `BOOKED`, `DISPATCHED`, `IN_TRANSIT`, `DISRUPTED`, `REROUTED`, `DELIVERED`, `ABORTED`.
- `events`: Ordered append-only log storing status transitions, location updates, and disruption alerts.

---

## 3. Database Invariants & Integrity Constraints

1. **Capacity Boundary:**
   `allocatedKg` across active `CONFIRMED` and unexpired `PENDING` reservations must never exceed `TransportSlot.capacityKg` or `StorageFacility.totalSlots`.
2. **Atomic Recovery Swaps:**
   When rerouting after an incident, releasing the old reservation and acquiring the new slot must occur in a single database transaction. If the new slot is unavailable, the transaction rolls back completely.
3. **Immutability of Event Log:**
   `shipment_events` records are append-only. No updates or deletions are permitted on past milestone events.
