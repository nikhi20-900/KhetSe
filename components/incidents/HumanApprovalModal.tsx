"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { RecoveryOption } from "@/lib/domain/recovery";
import { formatInr } from "@/lib/planning/format";
import { Button } from "@/components/ui/Button";
import { recoveryDecisionSchema } from "@/lib/contracts/incident.contract";

export function canRecordRecoveryDecision({
  incidentId,
  selected,
  approvedBy,
  managerApprovedBy,
  approvalNotes,
  confirmDecision,
}: {
  incidentId: string;
  selected: RecoveryOption | null;
  approvedBy: string;
  managerApprovedBy: string;
  approvalNotes: string;
  confirmDecision: boolean;
}) {
  if (!selected?.feasible) return false;
  if (
    (selected.changesReceivingWindow || selected.changesCommercialTerms) &&
    !managerApprovedBy.trim()
  ) {
    return false;
  }

  return recoveryDecisionSchema.safeParse({
    incidentId,
    action:
      selected.kind === "NO_ACTION"
        ? "SELECT_NO_ACTION"
        : "APPROVE_RECOVERY_PLAN",
    selectedRecoveryPlanId: selected.id,
    approvedBy,
    managerApprovedBy,
    approvalNotes,
    confirmDecision,
  }).success;
}

export function HumanApprovalModal({
  incidentId,
  options,
}: {
  incidentId: string;
  options: RecoveryOption[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState(
    options.find((option) => option.feasible)?.id ?? "rec_no_action"
  );
  const [approvedBy, setApprovedBy] = useState("");
  const [managerApprovedBy, setManagerApprovedBy] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [confirmDecision, setConfirmDecision] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selected = options.find((option) => option.id === selectedId) ?? null;
  const decisionReady = canRecordRecoveryDecision({
    incidentId,
    selected,
    approvedBy,
    managerApprovedBy,
    approvalNotes,
    confirmDecision,
  });

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  async function approve() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId,
          action:
            selected.kind === "NO_ACTION"
              ? "SELECT_NO_ACTION"
              : "APPROVE_RECOVERY_PLAN",
          selectedRecoveryPlanId: selected.id,
          approvedBy,
          confirmDecision,
          managerApprovedBy,
          approvalNotes,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail =
          body &&
          typeof body === "object" &&
          "detail" in body &&
          typeof body.detail === "string"
            ? body.detail
            : "The decision was not recorded.";
        setError(detail);
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("The approval could not be sent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Choose one option. Nothing is booked until you approve it.
        </legend>
        {options.map((option) => (
          <label key={option.id} className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="selectedRecoveryPlanId"
              value={option.id}
              checked={selectedId === option.id}
              disabled={!option.feasible}
              onChange={() => setSelectedId(option.id)}
              className="mt-1"
            />
            <span>
              <span className="font-semibold">{option.title}</span>
              {option.modeledCostInr !== null
                ? ` · ${formatInr(option.modeledCostInr)} modeled`
                : ""}
              {!option.feasible && option.rejection
                ? ` · ${option.rejection.category}`
                : ""}
            </span>
          </label>
        ))}
      </fieldset>
      <Button type="button" onClick={openDialog} disabled={!selected?.feasible}>
        Review and approve
      </Button>
      <dialog
        ref={dialogRef}
        className="w-[min(32rem,calc(100%-2rem))] rounded-xl border border-gray-200 bg-white p-0 text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void approve();
          }}
        >
          <h2 className="text-lg font-bold">Approve this decision</h2>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {selected
              ? `${selected.title}. ${selected.summary}`
              : "Select an option before approving."}
          </p>
          {selected?.changesReceivingWindow ? (
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              The booked Vashi window changes. A buyer or manager has to confirm
              that before the decision is stored.
            </p>
          ) : null}
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Approver (required)</span>
            <input
              value={approvedBy}
              onChange={(event) => setApprovedBy(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
              autoComplete="name"
              required
              minLength={3}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">
              Buyer or manager
              {selected?.changesReceivingWindow ||
              selected?.changesCommercialTerms
                ? " (required)"
                : " (if needed)"}
            </span>
            <input
              value={managerApprovedBy}
              onChange={(event) => setManagerApprovedBy(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
              autoComplete="name"
              required={
                Boolean(selected?.changesReceivingWindow) ||
                Boolean(selected?.changesCommercialTerms)
              }
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Notes</span>
            <textarea
              value={approvalNotes}
              onChange={(event) => setApprovalNotes(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
              rows={3}
              maxLength={500}
              aria-describedby="approval-notes-guidance"
            />
            <span
              id="approval-notes-guidance"
              className="text-xs text-gray-500 dark:text-gray-400"
            >
              Optional, up to 500 characters.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmDecision}
              onChange={(event) => setConfirmDecision(event.target.checked)}
              className="mt-1"
              required
            />
            <span>
              I explicitly approve this choice. It must not be applied without
              this confirmation.
            </span>
          </label>
          {error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}
          {!decisionReady ? (
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              Enter an approver, add buyer or manager sign-off when terms or
              receiving windows change, and check explicit approval to enable
              recording.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting || !decisionReady}>
              {submitting ? "Recording the decision…" : "Record decision"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
