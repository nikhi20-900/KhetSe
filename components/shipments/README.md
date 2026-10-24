# Shipment Lifecycle & Tracking Components

## Component Scope

This directory contains user interface components for visualizing shipment progression:

- `ShipmentTimeline.tsx`: Vertical/horizontal milestone stepper displaying dispatch, checkpoints, and delivery.
- `ShipmentStatusBadge.tsx`: Color-coded status indicator aligned with state machine states.
- `EventLogList.tsx`: Immutable chronological event stream with timestamps and location tags.
- `DeliveryReceiptCard.tsx`: Destination receiving acknowledgment summary.

## Ownership & Tracking

- **Owner:** Person 1 — Frontend and UX (`nikhi20-900`)
- **Tracking:** Tracked in [Issue #4](https://github.com/nikhi20-900/khetse/issues/4)
- **Status:** The Igatpuri demonstration shows a modeled checkpoint timeline and status. Live GPS is still out of scope. The full shipment lifecycle remains Issue #4.
