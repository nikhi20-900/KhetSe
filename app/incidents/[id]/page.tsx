interface IncidentPageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      <div className="border border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 p-8 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-red-900 dark:text-red-100">
            Disruption Alert &amp; Recovery #{id} &mdash; Placeholder
          </h1>
          <span className="text-xs px-2.5 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 font-semibold">
            Tracked in Issue #6
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          This view will display simulated disruption alerts (e.g., vehicle
          breakdown, thermal delay), present available alternative recovery
          routes alongside a mandatory No-Action alternative, and require
          explicit human approval before committing any recovery swap.
        </p>
        <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-2 border border-red-100 dark:border-red-900/40">
          <p>
            <strong>Planned Ownership:</strong> Person 1 (UI), Person 2
            (API/Swap), Person 3 (Feasibility Rules)
          </p>
          <p>
            <strong>Planned Architectural Rule:</strong> No unilateral automated
            commits &mdash; human-in-the-loop sign-off required.
          </p>
          <p className="italic">
            Notice: Interactive recovery modals and simulated incident triggers
            are stubbed in this scaffold.
          </p>
        </div>
      </div>
    </div>
  );
}
