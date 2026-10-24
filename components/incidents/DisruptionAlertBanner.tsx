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
      className="space-y-2 rounded-md border border-terracotta-300 bg-terracotta-50/60 px-5 py-4 text-charcoal-950"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-800">
        Simulated incident · decision status:{" "}
        {incident.status === "OPEN" ? "awaiting review" : "recorded"}
      </p>
      <h2 className="text-lg font-bold">
        Vehicle breakdown at {incident.checkpoint}
      </h2>
      <p className="text-sm leading-relaxed">
        Logged {formatIst(incident.loggedAt)} at km {incident.kilometer}. About{" "}
        {formatHours(incident.remainingShelfLifeHours)} hours of the declared
        shelf-life horizon remain. That clock is a modeled estimate, not a live
        sensor reading.{" "}
        {incident.status === "OPEN"
          ? "The truck booking stays as it is until a person approves a choice."
          : "A person has recorded a recovery decision for this incident."}
      </p>
      <Link
        href={`/incidents/${incident.id}`}
        className="inline-flex text-sm font-semibold text-terracotta-800 underline-offset-2 hover:underline"
      >
        {incident.status === "OPEN"
          ? "Review recovery options"
          : "View recorded decision"}
      </Link>
    </section>
  );
}
