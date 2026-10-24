# Shipment timeline and demo controls

This directory contains UI for the operational simulated Igatpuri shipment page at [`app/shipments/[id]/page.tsx`](../../app/shipments/%5Bid%5D/page.tsx). It does not provide a live GPS map; checkpoint names and events are simulated.

- [`ShipmentTimeline`](ShipmentTimeline.tsx) renders ordered demo shipment events.
- [`ShipmentStatusBadge`](ShipmentStatusBadge.tsx) presents the current domain status.
- [`EventLogList`](EventLogList.tsx) displays decision/audit entries.
- [`InjectBreakdownButton`](InjectBreakdownButton.tsx) posts `INJECT_BREAKDOWN` to `/api/incidents`, handles errors, and navigates to the resulting incident.
- [`ResetDemoButton`](ResetDemoButton.tsx) posts `RESET_DEMO` to `/api/incidents`.

The page reads local operation state using [`lib/operations/operations-store.ts`](../../lib/operations/operations-store.ts). This is distinct from the PostgreSQL-backed normal shipment endpoints under `/api/shipments`, which append immutable events along `BOOKED → DISPATCHED → IN_TRANSIT → DELIVERED`. See [`docs/API_CONTRACTS.md`](../../docs/API_CONTRACTS.md) for the API distinction.
