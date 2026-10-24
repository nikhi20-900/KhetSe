interface ShipmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShipmentPage({ params }: ShipmentPageProps) {
  const { id } = await params;

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Shipment Tracking #{id} &mdash; Placeholder
          </h1>
          <span className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">
            Tracked in Issues #4 &amp; #6
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          This view will render the shipment milestone timeline, tracking
          progression through dispatch, transit checkpoints, virtual disruption
          events, and final delivery confirmation.
        </p>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Planned Component Ownership:</strong> Person 1 (Frontend UI)
            &amp; Person 2 (Backend State API)
          </p>
          <p>
            <strong>Planned Features:</strong> State machine milestone timeline,
            disruption alert integration, and receipt display.
          </p>
          <p className="italic">
            Notice: Real-time GPS telematics and fake live location feeds are
            strictly out of scope.
          </p>
        </div>
      </div>
    </div>
  );
}
