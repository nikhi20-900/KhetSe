export function formatInr(amountInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);
}

/** Paise-accurate rupees for baseline scenario results. */
export function formatInrExact(amountInr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInr);
}

export function formatSignedInr(amountInr: number): string {
  const formatted = formatInrExact(Math.abs(amountInr));
  if (amountInr > 0) return `+${formatted}`;
  if (amountInr < 0) return `−${formatted}`;
  return formatted;
}

/** Registered scenario money is rounded to 2 decimal INR, including trailing zeros. */
export function formatModeledInr(amountInr: number): string {
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInr)}`;
}

export function formatKg(quantityKg: number): string {
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(quantityKg)} kg`;
}

export function formatKgPrecise(quantityKg: number): string {
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 3,
  }).format(quantityKg)} kg`;
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(hours);
}

export function formatPercent(fraction: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(fraction);
}

export function formatIst(iso: string): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return `${formatted} IST`;
}
