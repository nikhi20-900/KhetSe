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
    <div className="space-y-2">
      <Badge variant="danger">{label}</Badge>
      {rejection ? (
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {rejection.message}
        </p>
      ) : null}
    </div>
  );
}
