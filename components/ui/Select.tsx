import type { ReactNode, SelectHTMLAttributes } from "react";

import { FieldValidationFeedback } from "@/components/harvest/FieldValidationFeedback";

export function Select({
  id,
  label,
  hint,
  error,
  children,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 dark:text-linen-300"
      >
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-charcoal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta-500 dark:bg-charcoal-900 dark:text-linen-50 ${
          error
            ? "border-red-500 focus-visible:outline-red-500"
            : "border-sand-300 hover:border-sand-400 dark:border-charcoal-700 dark:hover:border-charcoal-600"
        }`}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed text-charcoal-500 dark:text-linen-400"
        >
          {hint}
        </p>
      ) : null}
      <FieldValidationFeedback id={`${id}-error`} message={error} />
    </div>
  );
}
