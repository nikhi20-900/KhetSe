"use client";

import { useRouter } from "next/navigation";

export function LotSwitcher({
  activeHarvestId,
  harvests,
}: {
  activeHarvestId: string;
  harvests: Array<{ harvestId: string; cropType: string; quantityKg: number }>;
}) {
  const router = useRouter();

  if (harvests.length <= 1) return null;

  return (
    <div className="flex w-full min-w-0 items-center gap-1.5 text-xs font-mono text-charcoal-600 dark:text-linen-300 sm:w-auto">
      <span>Lot:</span>
      <select
        value={activeHarvestId}
        onChange={(e) =>
          router.push(`/plans?harvestId=${encodeURIComponent(e.target.value)}`)
        }
        className="min-w-0 flex-1 rounded border border-sand-300 bg-white px-2 py-1 text-xs font-mono text-charcoal-900 dark:border-charcoal-700 dark:bg-charcoal-850 dark:text-linen-100 sm:max-w-[20rem]"
      >
        {harvests.map((h) => (
          <option key={h.harvestId} value={h.harvestId}>
            {h.harvestId} ({h.cropType}, {h.quantityKg.toLocaleString()}kg)
          </option>
        ))}
      </select>
    </div>
  );
}
