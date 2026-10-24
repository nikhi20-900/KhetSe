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
    <div>
      <p className="mb-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
        All amounts are modeled estimates.
      </p>
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">
          Cost breakdown. All amounts are modeled estimates.
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Amount (modeled estimate)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, amount]) => {
            const emphasize =
              label === "Estimated net return" ||
              label === "Total logistics cost";
            return (
              <tr
                key={label}
                className="border-t border-gray-200 dark:border-gray-800"
              >
                <th
                  scope="row"
                  className={`py-2 pr-3 text-left font-medium text-gray-700 dark:text-gray-300 ${emphasize ? "font-semibold text-gray-900 dark:text-gray-100" : ""}`}
                >
                  {label}
                </th>
                <td
                  className={`py-2 text-right text-gray-900 dark:text-gray-100 ${emphasize ? "font-semibold" : ""}`}
                >
                  {formatInr(amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
        {`Transport is ${formatInr(breakdown.dispatchBaseCostInr)} dispatch + ${formatInr(breakdown.perKmRateInr)}/km × ${breakdown.distanceKm} km, from the simulated demo tariff. Handling is ${formatInr(breakdown.handlingInr)} because the evidence register has no separate handling charge. Storage is ${formatInr(breakdown.storageInr)} because this plan is a direct delivery. Gross proceeds are ${formatKg(breakdown.quantityKg)} × ${formatPercent(breakdown.saleableFraction)} modeled saleable × ${formatInr(breakdown.priceInrPerKg)}/kg Grade A benchmark, after ${formatHours(breakdown.uncooledHours)} uncooled hours at the 1.2% per 24h ambient baseline.`}
      </p>
    </div>
  );
}
