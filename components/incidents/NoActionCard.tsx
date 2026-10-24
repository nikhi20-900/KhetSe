import type { RecoveryOption } from "@/lib/domain/recovery";

import { RecoveryOptionCard } from "./RecoveryOptionCard";

export function NoActionCard({
  option,
  selected,
  onSelect,
}: {
  option: RecoveryOption;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        No-action baseline
      </h3>
      <RecoveryOptionCard
        option={option}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
}
