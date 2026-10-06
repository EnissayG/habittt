import type { LocalDate } from '../localDate';

/** What the shelf window shows. */
export const WINDOW_VIEWS = ['day', 'evening', 'night', 'winter'] as const;
export type WindowView = (typeof WINDOW_VIEWS)[number];

const NIGHT_FROM = 21;
const NIGHT_UNTIL = 6;
const EVENING_FROM = 18;
/** Months with a snowy daytime view (northern hemisphere). */
const WINTER_MONTHS: ReadonlySet<number> = new Set([12, 1, 2]);

/**
 * The window view from the local hour (0-23) and the local day:
 * night from 21:00 to 05:59, evening from 18:00 to 20:59, otherwise day,
 * snowy in December, January and February.
 */
export function windowView(hour: number, today: LocalDate): WindowView {
  if (hour >= NIGHT_FROM || hour < NIGHT_UNTIL) return 'night';
  if (hour >= EVENING_FROM) return 'evening';
  const month = Number(today.slice(5, 7));
  return WINTER_MONTHS.has(month) ? 'winter' : 'day';
}
