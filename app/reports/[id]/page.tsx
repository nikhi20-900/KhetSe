interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Post-Shipment Report #{id} &mdash; Placeholder
          </h1>
          <span className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">
            Tracked in Issues #7 &amp; #8
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          This view will render the final audit report, including harvest intake
          parameters, planned vs. actual transit milestones, incident logs,
          human decision audits, counterfactual financial comparisons (recovery
          vs. no-action), and CSV export capabilities.
        </p>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Planned Ownership:</strong> Person 1 (Report UI), Person 2
            (Report Generation API), Person 3 (Financial Model)
          </p>
          <p>
            <strong>Planned Reporting Features:</strong> Export to CSV, itemized
            gross/net revenue breakdown, and simulated data notice.
          </p>
          <p className="italic">
            Notice: Hardcoded outcome numbers or unverified income gains are
            strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
