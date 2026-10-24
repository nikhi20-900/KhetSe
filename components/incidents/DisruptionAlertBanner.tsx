import Link from "next/link";

import { formatHours, formatIst } from "@/lib/planning/format";
import type { IncidentSnapshot } from "@/lib/domain/recovery";

export function DisruptionAlertBanner({
  incident,
}: {
  incident: IncidentSnapshot;
}) {
  return (
    <section
      role="alert"
      className="space-y-2 rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
    >
      <p className="text-xs font-semibold uppercase tracking-wide">
        Simulated incident
      </p>
      <h2 className="text-lg font-bold">
        Vehicle breakdown at {incident.checkpoint}
      </h2>
      <p className="text-sm leading-relaxed">
        Logged {formatIst(incident.loggedAt)} at km {incident.kilometer}. About{" "}
        {formatHours(incident.remainingShelfLifeHours)} hours of the declared
        shelf-life horizon remain. That clock is a modeled estimate, not a live
        sensor reading. The truck booking stays as it is until a person approves
        a choice.
      </p>
      <Link
        href={`/incidents/${incident.id}`}
        className="inline-flex text-sm font-semibold underline-offset-2 hover:underline"
      >
        Review recovery options
      </Link>
    </section>
  );
}
