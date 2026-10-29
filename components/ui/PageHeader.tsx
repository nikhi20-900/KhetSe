import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  badge,
}: {
  kicker?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="border-b border-sand-300 dark:border-charcoal-700 pb-5 pt-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          {kicker && (
            <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-700 dark:text-terracotta-400">
              {kicker}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal-950 dark:text-linen-50 sm:text-3xl">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <div className="max-w-3xl text-sm leading-relaxed text-charcoal-600 dark:text-linen-300">
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
