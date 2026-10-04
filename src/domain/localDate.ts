declare const localDateBrand: unique symbol;

/**
 * A calendar day in the user's local time, formatted 'YYYY-MM-DD'.
 * Branded so that an arbitrary string cannot be passed where a validated
 * date is expected: the only way to get one is parseLocalDate().
 */
export type LocalDate = string & { readonly [localDateBrand]: true };

const FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isLocalDate(value: string): value is LocalDate {
  const match = FORMAT.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Round-trip through a UTC date: an impossible day (April 31st, Feb 29th
  // of a non-leap year) rolls over to another day and no longer matches.
  return toUtcDate(year, month, day).toISOString().slice(0, 10) === value;
}

/** Throws on malformed input: callers are expected to pass valid dates. */
export function parseLocalDate(value: string): LocalDate {
  if (!isLocalDate(value)) {
    throw new Error(`Invalid local date: "${value}" (expected YYYY-MM-DD)`);
  }
  return value;
}

/** Number of days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  // Both days are placed at midnight UTC. UTC has no daylight saving time,
  // so every day is exactly 24 hours long and the division is exact.
  return Math.round((toEpochMs(to) - toEpochMs(from)) / MS_PER_DAY);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return new Date(toEpochMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10) as LocalDate;
}

function toEpochMs(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return toUtcDate(year, month, day).getTime();
}

function toUtcDate(year: number, month: number, day: number): Date {
  // setUTCFullYear rather than Date.UTC: Date.UTC maps years 0-99 to 1900-1999.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}
