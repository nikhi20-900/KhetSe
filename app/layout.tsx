import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KhetSe — Agricultural Harvest Logistics Coordination Platform",
  description:
    "Software-only harvest-to-market logistics coordination, dynamic recovery planning, and modeled counterfactual analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400"
              >
                KhetSe
              </Link>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium uppercase text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                Demo v0.1.0
              </span>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
              <Link
                href="/harvests/new"
                className="text-gray-800 hover:text-emerald-800 dark:text-gray-100 dark:hover:text-emerald-300"
              >
                Harvests
              </Link>
              <Link
                href="/plans"
                className="text-gray-800 hover:text-emerald-800 dark:text-gray-100 dark:hover:text-emerald-300"
              >
                Plans
              </Link>
              <span className="text-gray-400">Shipments</span>
              <span className="text-gray-400">Incidents</span>
              <span className="text-gray-400">Reports</span>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full p-6">{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 text-center text-xs text-gray-500">
          KhetSe &copy; 2026 &mdash; Software-only demonstration. Plan figures
          are modeled estimates.
        </footer>
      </body>
    </html>
  );
}
