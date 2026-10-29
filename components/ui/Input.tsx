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
        className="block text-sm font-semibold text-charcoal-800 dark:text-linen-200"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2.5 text-base text-khet-ink placeholder:text-khet-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-khet-green ${
          error
            ? "border-red-500 focus-visible:outline-red-500"
            : "border-khet-line hover:border-khet-muted/40"
        }`}
        {...props}
      />
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
