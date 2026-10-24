import type { AuditEntry } from "@/lib/domain/recovery";
import { formatIst } from "@/lib/planning/format";

export function EventLogList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
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
          className="rounded-lg border border-gray-200 px-4 py-3 text-sm dark:border-gray-700"
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {entry.action === "SELECT_NO_ACTION"
              ? "No action recorded"
              : "Recovery recorded"}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            {formatIst(entry.at)}. Approved by {entry.approvedBy}
            {entry.managerApprovedBy
              ? `. Window change confirmed by ${entry.managerApprovedBy}`
              : ""}
            .
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            Status {entry.previousStatus} to {entry.nextStatus}. Reservation{" "}
            {entry.reservationBefore.resourceId} to{" "}
            {entry.reservationAfter.resourceId}.
          </p>
          {entry.approvalNotes ? (
            <p className="text-gray-600 dark:text-gray-300">
              Notes: {entry.approvalNotes}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
