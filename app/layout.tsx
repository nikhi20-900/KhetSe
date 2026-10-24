import type { Metadata } from "next";
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
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                KhetSe
              </span>
              <span className="text-xs uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-medium">
                Scaffold v0.1.0
              </span>
            </div>
            <nav className="text-sm font-medium text-gray-600 dark:text-gray-300 space-x-6">
              <span className="text-gray-400">Harvests</span>
              <span className="text-gray-400">Plans</span>
              <span className="text-gray-400">Shipments</span>
              <span className="text-gray-400">Incidents</span>
              <span className="text-gray-400">Reports</span>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full p-6">{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 text-center text-xs text-gray-500">
          KhetSe &copy; 2026 &mdash; Software-only demonstration platform.
          Application features pending implementation.
        </footer>
      </body>
    </html>
  );
}
