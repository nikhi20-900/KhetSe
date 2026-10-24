import type { TimelineEvent } from "@/lib/domain/recovery";
import { formatIst } from "@/lib/planning/format";

export function ShipmentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-5 border-l border-sand-300 pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={`absolute -left-[1.35rem] mt-1 h-3 w-3 rounded-full ring-4 ring-white ${event.urgent ? "bg-terracotta-600" : "bg-sage-600"}`}
            aria-hidden="true"
          />
          <p className="font-mono text-xs text-charcoal-500">
            {formatIst(event.at)}
          </p>
          <p
            className={`text-sm font-semibold ${event.urgent ? "text-terracotta-800" : "text-charcoal-900"}`}
          >
            {event.urgent ? "Urgent: " : ""}
            {event.title}
          </p>
          <p className="text-sm leading-relaxed text-charcoal-600">
            {event.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
