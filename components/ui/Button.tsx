import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "sage" | "outline";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-terracotta text-white hover:bg-terracotta-600 active:bg-terracotta-700 border border-terracotta-700/40 shadow-xs dark:bg-terracotta dark:hover:bg-terracotta-600",
  secondary:
    "border border-sand-300 bg-white text-charcoal-900 hover:bg-sand-100 dark:border-charcoal-700 dark:bg-charcoal-850 dark:text-linen-100 dark:hover:bg-charcoal-800 shadow-xs",
  sage: "bg-sage-600 text-white hover:bg-sage-700 border border-sage-700/40 shadow-xs dark:bg-sage-600 dark:hover:bg-sage-500",
  danger:
    "bg-red-700 text-white hover:bg-red-800 border border-red-800 shadow-xs",
  outline:
    "border border-charcoal-900 text-charcoal-900 hover:bg-charcoal-900 hover:text-white dark:border-linen-300 dark:text-linen-100 dark:hover:bg-linen-100 dark:hover:text-charcoal-900",
};

const baseClass =
  "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium tracking-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-500 disabled:cursor-not-allowed disabled:opacity-50";

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
