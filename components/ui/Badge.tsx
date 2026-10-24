import type { ReactNode } from "react";

const variantClass = {
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  info: "bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100",
  success:
    "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100",
  warning: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  danger: "bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100",
} as const;

const toneClass = {
  gray: "neutral",
  sky: "info",
  green: "success",
  amber: "warning",
  red: "danger",
} as const;

export function Badge({
  children,
  variant,
  tone,
}: {
  children: ReactNode;
  variant?: keyof typeof variantClass;
  tone?: keyof typeof toneClass;
}) {
  const resolved = variant ?? (tone ? toneClass[tone] : "neutral");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass[resolved]}`}
    >
      {children}
    </span>
  );
}
