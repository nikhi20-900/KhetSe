import type { PlanBreakdown } from "@/lib/contracts/plan.contract";
import {
  formatHours,
  formatInr,
  formatKg,
  formatPercent,
} from "@/lib/planning/format";

export function CostBreakdownTable({
  breakdown,
}: {
  breakdown: PlanBreakdown;
}) {
  const rows = [
    ["Transport", breakdown.transportInr],
    ["Handling", breakdown.handlingInr],
    ["Storage", breakdown.storageInr],
    ["Total logistics cost", breakdown.logisticsTotalInr],
    ["Expected gross proceeds", breakdown.grossProceedsInr],
    ["Estimated net return", breakdown.netProceedsInr],
  ] as const;

  return (
    <details className="rounded-lg border border-sand-300 bg-sand-50/70 dark:border-charcoal-750 dark:bg-charcoal-900/60">
      <summary className="min-h-11 cursor-pointer rounded-lg px-3.5 py-3 text-sm font-semibold text-charcoal-800 marker:text-terracotta-700 hover:bg-sand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-500 dark:text-linen-200 dark:hover:bg-charcoal-800">
        View cost breakdown and assumptions
      </summary>
      <div className="space-y-2 border-t border-sand-200 p-3.5 dark:border-charcoal-750">
        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
          All amounts are modeled estimates.
        </p>
        <table className="w-full text-xs tabular-nums">
          <caption className="sr-only">
            Cost breakdown. All amounts are modeled estimates.
          </caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Amount (modeled estimate)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200 dark:divide-charcoal-750">
            {rows.map(([label, amount]) => {
              const isNet = label === "Estimated net return";
              const isTotal = label === "Total logistics cost";
              return (
                <tr
                  key={label}
                  className={isNet ? "bg-sage-100/50 dark:bg-sage-950/20" : ""}
                >
                  <th
                    scope="row"
                    className={`py-1.5 pr-2 text-left font-medium text-charcoal-700 dark:text-linen-300 ${
                      isNet
                        ? "font-bold text-sage-900 dark:text-sage-200"
                        : isTotal
                          ? "font-semibold text-charcoal-900 dark:text-linen-100"
                          : ""
                    }`}
                  >
                    {label}
                  </th>
                  <td
                    className={`py-1.5 text-right font-mono ${
                      isNet
                        ? "text-sm font-bold text-sage-900 dark:text-sage-200"
                        : isTotal
                          ? "font-semibold text-terracotta-700 dark:text-terracotta-400"
                          : "text-charcoal-800 dark:text-linen-200"
                    }`}
                  >
                    {formatInr(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-sand-200 pt-2 dark:border-charcoal-750">
          <p className="text-xs leading-relaxed text-charcoal-500 dark:text-linen-400">
            {`Transport is ${formatInr(breakdown.dispatchBaseCostInr)} dispatch + ${formatInr(breakdown.perKmRateInr)}/km × ${breakdown.distanceKm} km. This rate is the planning catalog tariff for this screen. It is not the baseline vehicle register used by the recovery comparison, where the ventilated truck is ₹2,800 plus ₹38/km. Handling is ${formatInr(breakdown.handlingInr)} because the evidence register has no separate handling charge. Storage is ${formatInr(breakdown.storageInr)} because this plan is a direct delivery. Gross proceeds are ${formatKg(breakdown.quantityKg)} × ${formatPercent(breakdown.saleableFraction)} modeled saleable × ${formatInr(breakdown.priceInrPerKg)}/kg Grade A benchmark, after ${formatHours(breakdown.uncooledHours)} uncooled hours at the 1.2% per 24h ambient baseline.`}
          </p>
        </div>
      </div>
    </details>
  );
}
