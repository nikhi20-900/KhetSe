export const MARKET_TIME_ZONE = "Asia/Kolkata";

export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

export interface ReceivingSchedule {
  departureIso: string;
  arrivalIso: string;
  elapsedHours: number;
  waitHours: number;
  transitHours: number;
}

export function civilDateInTimeZone(
  instant: Date,
  timeZone = MARKET_TIME_ZONE
): CivilDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: read("year"), month: read("month"), day: read("day") };
}

export function addCivilDays(date: CivilDate, days: number): CivilDate {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days)
  );
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function instantInMarketZone(date: CivilDate, hhmm: string): Date {
  const [hour, minute] = hhmm.split(":").map((part) => Number(part));
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  const hourText = String(hour).padStart(2, "0");
  const minuteText = String(minute).padStart(2, "0");
  return new Date(
    `${date.year}-${month}-${day}T${hourText}:${minuteText}:00+05:30`
  );
}

/** Tomorrow at 06:00 IST, as a `datetime-local` value. Matches the demo harvest clock. */
export function defaultHarvestLocalInput(now = new Date()): string {
  const tomorrow = addCivilDays(civilDateInTimeZone(now), 1);
  const month = String(tomorrow.month).padStart(2, "0");
  const day = String(tomorrow.day).padStart(2, "0");
  return `${tomorrow.year}-${month}-${day}T06:00`;
}

export function nextReceivingWindowStart(
  harvestTime: Date,
  windowStart: string
): Date | null {
  const origin = civilDateInTimeZone(harvestTime);
  for (let offset = 0; offset <= 14; offset += 1) {
    const day = addCivilDays(origin, offset);
    const start = instantInMarketZone(day, windowStart);
    if (start.getTime() > harvestTime.getTime()) {
      return start;
    }
  }
  return null;
}

/**
 * Earliest arrival inside a daily IST receiving window.
 * Departure cannot precede harvest completion, and arrival must fall
 * inside both the window and the declared shelf-life.
 */
export function scheduleReceivingWindow(input: {
  harvestTime: Date;
  transitHours: number;
  shelfLifeHours: number;
  windowStart: string;
  windowEnd: string;
}): ReceivingSchedule | null {
  const transitMs = input.transitHours * 3_600_000;
  const deadline =
    input.harvestTime.getTime() + input.shelfLifeHours * 3_600_000;
  const origin = civilDateInTimeZone(input.harvestTime);

  for (let offset = 0; offset <= 14; offset += 1) {
    const day = addCivilDays(origin, offset);
    const windowStart = instantInMarketZone(day, input.windowStart);
    const windowEnd = instantInMarketZone(day, input.windowEnd);

    if (windowEnd.getTime() <= input.harvestTime.getTime()) {
      continue;
    }
    if (windowStart.getTime() > deadline) {
      break;
    }

    const earliestArrival = Math.max(
      windowStart.getTime(),
      input.harvestTime.getTime() + transitMs
    );
    if (earliestArrival <= windowEnd.getTime() && earliestArrival <= deadline) {
      const departure = earliestArrival - transitMs;
      return {
        departureIso: new Date(departure).toISOString(),
        arrivalIso: new Date(earliestArrival).toISOString(),
        elapsedHours:
          (earliestArrival - input.harvestTime.getTime()) / 3_600_000,
        waitHours: (departure - input.harvestTime.getTime()) / 3_600_000,
        transitHours: input.transitHours,
      };
    }
  }

  return null;
}
