export default function NewHarvestPage() {
  return (
    <div className="py-8 max-w-3xl mx-auto space-y-6">
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Harvest Intake &mdash; Placeholder
          </h1>
          <span className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">
            Tracked in Issue #2
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          This view will provide the intake form for farmers and harvest
          coordinators to record crop profile, harvest volume, geographic
          origin, harvest timestamp, declared quality grade, and handling
          requirements.
        </p>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Planned Component Ownership:</strong> Person 1 &mdash;
            Frontend and UX (<code>nikhi20-900</code>)
          </p>
          <p>
            <strong>Planned Features:</strong> Zod schema validation, inline
            field error states, and transition to plan comparison.
          </p>
          <p className="italic">
            Notice: Functional forms and data inputs are intentionally omitted
            in this scaffold phase.
          </p>
        </div>
      </div>
    </div>
  );
}
