import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "sage" | "outline";

const variantClass: Record<Variant, string> = {
  primary:
    "border border-khet-greenDark/30 bg-khet-green text-white hover:bg-khet-greenDark",
  secondary:
    "border border-khet-line bg-white text-khet-ink hover:bg-khet-sand",
  sage: "border border-khet-greenDark/30 bg-khet-green text-white hover:bg-khet-greenDark",
  danger: "border border-red-800 bg-red-700 text-white hover:bg-red-800",
  outline:
    "border border-khet-ink text-khet-ink hover:bg-khet-ink hover:text-white",
};

const baseClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold tracking-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khet-green disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...props
}: {
  variant?: Variant;
  href?: string;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `${baseClass} ${variantClass[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
