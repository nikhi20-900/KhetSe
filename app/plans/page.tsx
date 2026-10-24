export default function PlansPage() {
  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Logistics Plan Comparison &mdash; Placeholder
          </h1>
          <span className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">
            Tracked in Issue #2
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          This view will compare feasible multi-modal logistics options (market,
          transport vehicle, and storage) alongside explicit, human-readable
          explanations for infeasible or rejected plans.
        </p>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Planned Component Ownership:</strong> Person 1 &mdash;
            Frontend and UX (<code>nikhi20-900</code>)
          </p>
          <p>
            <strong>Planned Features:</strong> Side-by-side plan trade-off
            cards, rejection reason badges, and booking trigger.
          </p>
          <p className="italic">
            Notice: Hardcoded mock plans and fake financial estimates are
            prohibited in this scaffold phase.
          </p>
        </div>
      </div>
    </div>
  );
}
