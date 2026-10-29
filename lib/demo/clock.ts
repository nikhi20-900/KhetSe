const ZONE = "Asia/Kolkata";

export function addHours(iso: string, hours: number): Date {
  return new Date(new Date(iso).getTime() + hours * 3_600_000);
}

export function formatDispatchLabel(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const time = clock(date);
  return `${day} · ${time} IST`;
}

export function formatDayTime(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    day: "numeric",
    month: "short",
  }).format(date);
  return `${day} · ${clock(date)} IST`;
}

export function formatClock(iso: string): string {
  return `${clock(new Date(iso))} IST`;
}

export function formatTimelineWhen(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    day: "numeric",
    month: "short",
  }).format(date);
  return `${day} · ${clock(date)}`;
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatHourCount(hours: number): string {
  const text = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(hours);
  return `${text} ${text === "1" ? "hour" : "hours"}`;
}

function clock(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
