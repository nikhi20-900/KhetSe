import type { ConstraintRejection } from "@/lib/contracts/plan.contract";
import { Badge } from "@/components/ui/Badge";

export function ConstraintRejectionBadge({
  category,
  rejection,
}: {
  category?: string;
  rejection?: ConstraintRejection;
}) {
  const label = rejection?.category ?? category;
  if (!label) {
    return null;
  }

  return (
    <div className="space-y-1.5 rounded border border-red-200 bg-red-50/50 p-2.5 dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex items-center gap-2">
        <Badge variant="danger">{label}</Badge>
        {rejection?.code && (
          <span className="font-mono text-2xs uppercase text-red-700 dark:text-red-400">
            {rejection.code}
          </span>
        )}
      </div>
      {rejection ? (
        <p className="text-xs leading-relaxed text-charcoal-700 dark:text-linen-300">
          {rejection.message}
        </p>
      ) : null}
    </div>
  );
}
