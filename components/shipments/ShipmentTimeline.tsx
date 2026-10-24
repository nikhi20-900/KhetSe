import type { TimelineEvent } from "@/lib/domain/recovery";
import { formatIst } from "@/lib/planning/format";

export function ShipmentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-4 border-l border-gray-200 pl-4 dark:border-gray-700">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={`absolute -left-[1.35rem] mt-1 h-3 w-3 rounded-full ${event.urgent ? "bg-red-600" : "bg-emerald-600"}`}
            aria-hidden="true"
          />
          <p className="text-xs text-gray-500">{formatIst(event.at)}</p>
          <p
            className={`text-sm font-semibold ${event.urgent ? "text-red-800 dark:text-red-200" : ""}`}
          >
            {event.urgent ? "Urgent: " : ""}
            {event.title}
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {event.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
