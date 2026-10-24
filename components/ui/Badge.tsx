import type { ReactNode } from "react";

const variantClass = {
  neutral:
    "bg-sand-100 text-charcoal-800 border border-sand-300 dark:bg-charcoal-800 dark:text-linen-200 dark:border-charcoal-700",
  info: "bg-charcoal-800 text-linen-100 border border-charcoal-700 dark:bg-charcoal-700 dark:text-linen-100",
  success:
    "bg-sage-100 text-sage-900 border border-sage-300 dark:bg-sage-900/50 dark:text-sage-200 dark:border-sage-700/60",
  warning:
    "bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800",
  danger:
    "bg-red-50 text-red-900 border border-red-300 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800",
  terracotta:
    "bg-terracotta-50 text-terracotta-900 border border-terracotta-300 dark:bg-terracotta-950/50 dark:text-terracotta-200 dark:border-terracotta-800",
  sage: "bg-sage-100 text-sage-900 border border-sage-300 dark:bg-sage-900/50 dark:text-sage-200 dark:border-sage-700/60",
} as const;

const toneClass = {
  gray: "neutral",
  sky: "info",
  green: "success",
  amber: "warning",
  red: "danger",
  terracotta: "terracotta",
  sage: "sage",
} as const;

export function Badge({
  children,
  variant,
  tone,
  className = "",
}: {
  children: ReactNode;
  variant?: keyof typeof variantClass;
  tone?: keyof typeof toneClass;
  className?: string;
}) {
  const resolved = variant ?? (tone ? toneClass[tone] : "neutral");
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium tracking-tight ${variantClass[resolved]} ${className}`}
    >
      {children}
    </span>
  );
}
