import type { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
}: {
  title: string;
  description: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-sand-400 bg-sand-50/60 p-8 text-center dark:border-charcoal-700 dark:bg-charcoal-900/40">
      <div className="mx-auto max-w-md space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sand-200 text-charcoal-700 dark:bg-charcoal-800 dark:text-linen-300 font-mono text-sm font-bold">
          !
        </div>
        <h3 className="text-base font-semibold text-charcoal-900 dark:text-linen-100">
          {title}
        </h3>
        <div className="text-xs sm:text-sm text-charcoal-600 dark:text-linen-400 leading-relaxed">
          {description}
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {actionLabel && (actionHref || onAction) && (
            <Button href={actionHref} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && secondaryActionHref && (
            <Button href={secondaryActionHref} variant="secondary">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
