"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/" },
  { label: "Harvest Intake", href: "/harvests/new" },
  { label: "Logistics Plans", href: "/plans" },
  { label: "Shipment Tracking", href: "/shipments/demo-igatpuri" },
  { label: "Incident Recovery", href: "/incidents/inc_demo_igatpuri" },
  { label: "Simulation Lab", href: "/simulation" },
  { label: "Post-Shipment Report", href: "/reports/demo-igatpuri" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return (
      pathname.startsWith(href) ||
      (href.includes("/demo-") && pathname.includes(href.split("/")[1]))
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-800 bg-charcoal text-linen shadow-sm">
      {/* A clear demo label avoids suggesting live operational telemetry. */}
      <div className="border-b border-charcoal-850 bg-charcoal-950/70 px-4 py-1 text-2xs font-mono text-charcoal-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-charcoal-800 px-1.5 py-0.5 text-linen-300 text-2xs border border-charcoal-700">
              DEMONSTRATION ENVIRONMENT
            </span>
            <span className="hidden sm:inline">
              Scenario records · no live GPS feed
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo / Identity */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-linen-100 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded bg-terracotta text-charcoal font-black text-sm tracking-wider shadow-xs">
                K
              </span>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-linen-50 leading-none">
                  KhetSe
                </span>
                <span className="text-2xs font-mono uppercase tracking-widest text-charcoal-400 leading-none mt-0.5">
                  Harvest Logistics
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-1 text-xs font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                    active
                      ? "bg-charcoal-800 text-linen-50 font-semibold"
                      : "text-charcoal-300 hover:text-linen-100 hover:bg-charcoal-850"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-terracotta rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-charcoal-300 hover:bg-charcoal-800 hover:text-linen-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile Navigation"
            className="md:hidden border-t border-charcoal-800 py-3 space-y-1"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-charcoal-800 text-white font-semibold border-l-2 border-terracotta"
                      : "text-charcoal-300 hover:bg-charcoal-850 hover:text-white"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
