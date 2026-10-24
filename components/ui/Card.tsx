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
      className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {header ? (
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          {header}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
