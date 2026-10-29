import type { ReactNode } from "react";
import Link from "next/link";
import { CANONICAL_SHIPMENT_ID } from "@/lib/demo/constants";

const STEPS = [
  { id: 1, label: "Harvest details", href: "/harvests/new" },
  { id: 2, label: "Compare plans", href: "/plans" },
  { id: 3, label: "Reserve capacity", href: "/reservations/new" },
  {
    id: 4,
    label: "Track shipment",
    href: `/shipments/${CANONICAL_SHIPMENT_ID}`,
  },
];

export function WorkflowStepper({
  current,
  hrefFor,
}: {
  current: 1 | 2 | 3 | 4;
  hrefFor?: (id: number, fallback: string) => string;
}) {
  return (
    <ol className="flex gap-4 overflow-x-auto pb-1 text-sm">
      {STEPS.map((step) => {
        const done = step.id < current;
        const active = step.id === current;
        const href = hrefFor ? hrefFor(step.id, step.href) : step.href;
        return (
          <li key={step.id} className="shrink-0">
            <Link
              href={href}
              aria-current={active ? "step" : undefined}
              className={`inline-flex items-center gap-2 rounded-md ${
                active
                  ? "font-semibold text-khet-green"
                  : done
                    ? "text-khet-muted"
                    : "text-khet-muted/80"
              }`}
            >
              {done ? (
                <span aria-hidden="true" className="text-khet-green">
                  ✓
                </span>
              ) : (
                <span>{step.id}</span>
              )}
              <span>{step.label}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function PageTitle({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-khet-ink sm:text-[2.5rem] sm:leading-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm text-khet-muted sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {aside}
    </div>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red";
  children: ReactNode;
}) {
  const toneClass = {
    green: "bg-khet-mint text-khet-green",
    amber: "bg-[#f8efd4] text-[#8a5a18]",
    red: "bg-khet-rose text-khet-roseInk",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-khet-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold tabular-nums text-khet-ink">
        {value}
      </dd>
    </div>
  );
}
