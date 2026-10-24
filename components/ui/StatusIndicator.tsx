import type { ReactNode } from "react";

export type OperationalStatus =
  | "BOOKED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DISRUPTED"
  | "REROUTED"
  | "ABORTED"
  | "FEASIBLE"
  | "REJECTED"
  | "PENDING"
  | "CONFIRMED";

const STATUS_CONFIG: Record<
  OperationalStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  BOOKED: {
    label: "Booked",
    bg: "bg-sand-100 dark:bg-charcoal-800",
    text: "text-charcoal-800 dark:text-linen-200",
    border: "border-sand-300 dark:border-charcoal-700",
    dot: "bg-charcoal-500",
  },
  DISPATCHED: {
    label: "Dispatched",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  IN_TRANSIT: {
    label: "In Transit",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-900 dark:text-blue-200",
    border: "border-blue-300 dark:border-blue-800",
    dot: "bg-sage-600",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-sage-100 dark:bg-sage-900/40",
    text: "text-sage-900 dark:text-sage-200",
    border: "border-sage-300 dark:border-sage-700",
    dot: "bg-sage-600",
  },
  DISRUPTED: {
    label: "Disrupted",
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-900 dark:text-red-200",
    border: "border-red-300 dark:border-red-800",
    dot: "bg-terracotta-600",
  },
  REROUTED: {
    label: "Rerouted",
    bg: "bg-terracotta-50 dark:bg-terracotta-950/40",
    text: "text-terracotta-900 dark:text-terracotta-200",
    border: "border-terracotta-300 dark:border-terracotta-800",
    dot: "bg-terracotta-500",
  },
  ABORTED: {
    label: "Aborted",
    bg: "bg-charcoal-200 dark:bg-charcoal-800",
    text: "text-charcoal-800 dark:text-charcoal-300",
    border: "border-charcoal-400 dark:border-charcoal-700",
    dot: "bg-charcoal-600",
  },
  FEASIBLE: {
    label: "Feasible",
    bg: "bg-sage-100 dark:bg-sage-900/40",
    text: "text-sage-900 dark:text-sage-200",
    border: "border-sage-300 dark:border-sage-700",
    dot: "bg-sage-600",
  },
  REJECTED: {
    label: "Infeasible",
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-900 dark:text-red-200",
    border: "border-red-300 dark:border-red-800",
    dot: "bg-red-500",
  },
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-sage-100 dark:bg-sage-900/40",
    text: "text-sage-900 dark:text-sage-200",
    border: "border-sage-300 dark:border-sage-700",
    dot: "bg-sage-600",
  },
};

export function StatusIndicator({
  status,
  customLabel,
  showDot = true,
  className = "",
}: {
  status: OperationalStatus | string;
  customLabel?: ReactNode;
  showDot?: boolean;
  className?: string;
}) {
  const normalized = status.toUpperCase();
  const knownStatus = normalized in STATUS_CONFIG;
  const config = knownStatus
    ? STATUS_CONFIG[normalized as OperationalStatus]
    : {
        ...STATUS_CONFIG.BOOKED,
        label: status.replaceAll("_", " "),
      };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium tracking-tight font-mono ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{customLabel ?? config.label}</span>
    </span>
  );
}
