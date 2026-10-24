export default function HomePage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8">
      <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 rounded-xl space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          KhetSe &mdash; Agricultural Harvest Logistics Coordination
        </h1>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          KhetSe is an end-to-end software coordination platform designed to
          bridge harvest planning, dynamic multi-modal routing, transactional
          capacity reservations, simulated in-transit disruption handling, and
          verifiable counterfactual financial modeling.
        </p>
        <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full">
          <span>Status: Repository Scaffold &amp; Placeholders Only</span>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 rounded-xl space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Planned Application Workflow
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Application logic, interactive forms, and database access are strictly
          unimplemented in this scaffold phase. Implementation of the full
          journey is actively tracked across project milestones:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>
            <strong>Harvest Intake:</strong> Capture crop, volume, origin,
            harvest time, and quality. (Tracked in Issue #2)
          </li>
          <li>
            <strong>Plan Comparison:</strong> Compare feasible transport,
            market, and storage combinations. (Tracked in Issue #2)
          </li>
          <li>
            <strong>Capacity Booking:</strong> Transactional reservation of
            transport and warehouse slots. (Tracked in Issue #3)
          </li>
          <li>
            <strong>Shipment Tracking:</strong> State machine tracking simulated
            progress and checkpoints. (Tracked in Issue #4)
          </li>
          <li>
            <strong>Disruption &amp; Recovery:</strong> Simulated incident
            alerting, recovery options, and mandatory human sign-off. (Tracked
            in Issue #5, #6)
          </li>
          <li>
            <strong>Counterfactual Financials:</strong> Transparent comparison
            of recovery vs. no-action baseline. (Tracked in Issue #7)
          </li>
          <li>
            <strong>Post-Shipment Report:</strong> Full audit summary,
            verifiable metrics, and CSV export. (Tracked in Issue #8)
          </li>
        </ol>
      </div>

      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          Scaffold Architecture Notice:
        </p>
        <p>
          Per repository setup standards, all production UI dashboards,
          simulated data streams, and database queries are stubbed. To view
          active implementation tasks, please consult the GitHub Issue Backlog.
        </p>
      </div>
    </div>
  );
}
