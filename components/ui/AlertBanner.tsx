import type { ReactNode } from "react";

type AlertTone = "incident" | "modeled" | "info" | "success";

const TONE_CONFIG: Record<
  AlertTone,
  {
    bg: string;
    border: string;
    text: string;
    titleText: string;
    icon: string;
  }
> = {
  incident: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-300 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
    titleText: "text-red-950 dark:text-red-100",
    icon: "🚨",
  },
  modeled: {
    bg: "bg-amber-50/70 dark:bg-amber-950/30",
    border: "border-amber-300/80 dark:border-amber-800/80",
    text: "text-amber-800 dark:text-amber-300",
    titleText: "text-amber-950 dark:text-amber-200",
    icon: "⚖️",
  },
  info: {
    bg: "bg-sand-100/80 dark:bg-charcoal-800/80",
    border: "border-sand-300 dark:border-charcoal-700",
    text: "text-charcoal-700 dark:text-linen-300",
    titleText: "text-charcoal-900 dark:text-linen-100",
    icon: "📋",
  },
  success: {
    bg: "bg-sage-50 dark:bg-sage-950/40",
    border: "border-sage-300 dark:border-sage-800",
    text: "text-sage-800 dark:text-sage-200",
    titleText: "text-sage-950 dark:text-sage-100",
    icon: "✓",
  },
};

export function AlertBanner({
  tone = "info",
  title,
  children,
  action,
  className = "",
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const config = TONE_CONFIG[tone];

  return (
    <div
      role={tone === "incident" ? "alert" : "region"}
      className={`rounded-md border p-4 ${config.bg} ${config.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {title && (
            <h3
              className={`text-sm font-semibold tracking-tight ${config.titleText}`}
            >
              {title}
            </h3>
          )}
          <div className={`text-xs leading-relaxed ${config.text}`}>
            {children}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
