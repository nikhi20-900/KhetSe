import type { InputHTMLAttributes } from "react";

import { FieldValidationFeedback } from "@/components/harvest/FieldValidationFeedback";

export function Input({
  id,
  label,
  hint,
  error,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-800 dark:text-gray-200"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-gray-950 dark:text-gray-100 ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
        }`}
        {...props}
      />
      {hint ? (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed text-gray-500 dark:text-gray-400"
        >
          {hint}
        </p>
      ) : null}
      <FieldValidationFeedback id={`${id}-error`} message={error} />
    </div>
  );
}
