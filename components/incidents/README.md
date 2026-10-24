# Incident and recovery UI

These components support the simulated `demo-igatpuri` breakdown story. The incident page reads its state from the local operations store through [`app/incidents/[id]/page.tsx`](../../app/incidents/%5Bid%5D/page.tsx); mutations call `/api/incidents`.

- [`DisruptionAlertBanner`](DisruptionAlertBanner.tsx) identifies the simulated incident and its checkpoint.
- [`RecoveryOptionCard`](RecoveryOptionCard.tsx) presents each modeled recovery option and its feasibility/cost information.
- [`NoActionCard`](NoActionCard.tsx) displays the no-action baseline explicitly.
- [`HumanApprovalModal`](HumanApprovalModal.tsx) requires a selected feasible option, approver name, explicit confirmation, and a buyer/manager name when commercial terms or receiving window change. It submits the shared `recoveryDecisionSchema` and shows failures without claiming a decision was recorded.

Domain behavior lives in [`lib/domain/recovery.ts`](../../lib/domain/recovery.ts), and service/storage behavior in [`lib/operations/recovery-service.ts`](../../lib/operations/recovery-service.ts) and [`lib/operations/operations-store.ts`](../../lib/operations/operations-store.ts). A simulated alert and no-action decision use the demo operations store; a recovery that changes capacity requires a linked PostgreSQL reservation and a successful swap transaction. This is not live vehicle tracking. See [`docs/API_CONTRACTS.md`](../../docs/API_CONTRACTS.md) and [`tests/unit/recovery-ui.test.tsx`](../../tests/unit/recovery-ui.test.tsx).
