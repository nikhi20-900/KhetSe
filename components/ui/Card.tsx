import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  header,
  footer,
}: {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-sand-300 bg-white dark:border-charcoal-750 dark:bg-charcoal-850 ${className}`}
    >
      {header ? (
        <div className="border-b border-sand-200 px-5 py-3.5 bg-sand-50/70 dark:border-charcoal-750 dark:bg-charcoal-900/60">
          {header}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="border-t border-sand-200 px-5 py-3.5 bg-sand-50/40 dark:border-charcoal-750 dark:bg-charcoal-900/40">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
