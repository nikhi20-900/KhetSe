"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CANONICAL_SHIPMENT_ID } from "@/lib/demo/constants";

const NAV = [
  {
    label: "Farmer desk",
    href: "/farmer",
    match: (path: string) => path.startsWith("/farmer"),
  },
  { label: "Overview", href: "/", match: (path: string) => path === "/" },
  {
    label: "Harvests",
    href: "/harvests/new",
    match: (path: string) =>
      path.startsWith("/harvests") ||
      path.startsWith("/plans") ||
      path.startsWith("/reservations"),
  },
  {
    label: "Shipments",
    href: `/shipments/${CANONICAL_SHIPMENT_ID}`,
    match: (path: string) =>
      path.startsWith("/shipments") || path.startsWith("/incidents"),
  },
  {
    label: "Reports",
    href: `/reports/${CANONICAL_SHIPMENT_ID}`,
    match: (path: string) => path.startsWith("/reports"),
  },
  {
    label: "Simulation",
    href: "/simulation",
    match: (path: string) => path.startsWith("/simulation"),
  },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-khet-yellow text-khet-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khet-ink"
          aria-label="KhetSe home"
        >
          <Sprout />
          <span className="text-2xl font-bold tracking-tight">khetse</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="ml-6 hidden flex-1 items-center justify-center gap-1 md:flex"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={item.match(pathname)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-khet-ink/80 sm:inline">
            Demo workspace
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-khet-yellow text-xs font-bold"
            aria-label="Demo account, initials A S"
            title="Demo account"
          >
            AS
          </span>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="space-y-1 border-t border-khet-ink/10 px-4 py-3 md:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-md px-2 text-sm font-semibold"
              aria-current={item.match(pathname) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`border-b-2 px-3 py-4 text-sm font-semibold ${
        active ? "border-khet-brown" : "border-transparent hover:border-khet-ink/30"
      }`}
    >
      {children}
    </Link>
  );
}

function Sprout() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 text-khet-green" aria-hidden="true">
      <path
        d="M16 28V14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M16 18c0-5 4.2-8 9-8-1.2 5-4 8-9 8z"
        fill="currentColor"
      />
      <path
        d="M16 21c0-4-3.2-6.5-7.5-6.5 1.2 4 3.4 6.5 7.5 6.5z"
        fill="currentColor"
      />
    </svg>
  );
}
