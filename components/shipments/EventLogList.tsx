import type { AuditEntry } from "@/lib/domain/recovery";
import { formatIst } from "@/lib/planning/format";

export function EventLogList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-charcoal-600">
        No recovery decision has been recorded. The booking cannot change until
        a person approves one.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-md border border-sand-300 px-4 py-3 text-sm"
        >
          <p className="font-semibold text-charcoal-900">
            {entry.action === "SELECT_NO_ACTION"
              ? "No action recorded"
              : "Recovery recorded"}
          </p>
          <p className="text-charcoal-600">
            {formatIst(entry.at)}. Approved by {entry.approvedBy}
            {entry.managerApprovedBy
              ? `. Window change confirmed by ${entry.managerApprovedBy}`
              : ""}
            .
          </p>
          <p className="text-charcoal-700">
            Status {entry.previousStatus} to {entry.nextStatus}. Reservation{" "}
            {entry.reservationBefore.resourceId} to{" "}
            {entry.reservationAfter.resourceId}.
          </p>
          {entry.approvalNotes ? (
            <p className="text-charcoal-600">Notes: {entry.approvalNotes}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
