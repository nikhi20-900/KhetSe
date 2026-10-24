import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-sand-300 bg-sand-100/70 text-charcoal-600 dark:border-charcoal-800 dark:bg-charcoal-950 dark:text-linen-400 px-6 py-6 text-xs">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-charcoal-900 dark:text-linen-100">
              KhetSe Logistics System
            </span>
            <span className="text-2xs font-mono uppercase bg-sand-200 dark:bg-charcoal-800 px-1.5 py-0.5 rounded text-charcoal-700 dark:text-linen-300 border border-sand-300 dark:border-charcoal-700">
              v0.1.0 &middot; Demonstration
            </span>
          </div>
          <p className="leading-relaxed text-charcoal-500 dark:text-linen-400">
            Software-only harvest coordination. All transit tariffs, loss
            percentages, market benchmark prices, and proceeds are modeled
            demonstration estimates. Live GPS telematics and fabricated
            real-time vehicle positions are strictly excluded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-2xs font-mono text-charcoal-500 dark:text-linen-400">
          <Link
            href="/harvests/new"
            className="hover:text-terracotta transition-colors"
          >
            Harvest Intake
          </Link>
          <Link
            href="/plans"
            className="hover:text-terracotta transition-colors"
          >
            Logistics Plans
          </Link>
          <Link
            href="/shipments/demo-igatpuri"
            className="hover:text-terracotta transition-colors"
          >
            Shipment Demo
          </Link>
          <Link
            href="/incidents/inc_demo_igatpuri"
            className="hover:text-terracotta transition-colors"
          >
            Incident Demo
          </Link>
          <Link
            href="/reports/demo-igatpuri"
            className="hover:text-terracotta transition-colors"
          >
            Audit Report
          </Link>
        </div>
      </div>
    </footer>
  );
}
