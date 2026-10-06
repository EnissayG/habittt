import { addDays, daysBetween, parseLocalDate, type LocalDate } from './localDate';
import type { DayEntry } from './timeline';

// The journal's calendar: one month at a time, weeks starting on Monday.
// Pure: the weekday is counted from a known Monday, without Date.

/** A month, 'YYYY-MM'. */
export type MonthId = string;

export interface CalendarDay {
  date: LocalDate;
  dayOfMonth: number;
  /** The day of the habit, or null outside its period (before the start, after the end). */
  entry: DayEntry | null;
  today: boolean;
}

/** A Monday, to count weekdays from. */
const A_MONDAY = parseLocalDate('2024-01-01');

export function monthOf(date: LocalDate): MonthId {
  return date.slice(0, 7);
}

function firstDay(month: MonthId): LocalDate {
  return parseLocalDate(`${month}-01`);
}

function nextMonth(month: MonthId): MonthId {
  const [year, number] = month.split('-').map(Number) as [number, number];
  return number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, '0')}`;
}

/** Every month from the one of `start` to the one of `end`, oldest first. */
export function journalMonths(start: LocalDate, end: LocalDate): MonthId[] {
  const last = monthOf(end);
  const months = [monthOf(start)];
  while (months[months.length - 1]! < last) months.push(nextMonth(months[months.length - 1]!));
  return months;
}

/**
 * The weeks of a month, Monday first; null pads the first and last weeks.
 * `days` are the habit's days (buildTimeline), oldest first.
 */
export function monthCalendar(
  month: MonthId,
  days: readonly DayEntry[],
  today: LocalDate,
): (CalendarDay | null)[][] {
  const first = firstDay(month);
  const length = daysBetween(first, firstDay(nextMonth(month)));
  const lead = ((daysBetween(A_MONDAY, first) % 7) + 7) % 7;
  const start = days[0]?.date;

  const cells: (CalendarDay | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 0; i < length; i++) {
    const date = addDays(first, i);
    const index = start === undefined ? -1 : daysBetween(start, date);
    cells.push({ date, dayOfMonth: i + 1, entry: days[index] ?? null, today: date === today });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

/** The days of the month with a note or a relapse, newest first. */
export function monthEntries(month: MonthId, days: readonly DayEntry[]): DayEntry[] {
  return days
    .filter((day) => monthOf(day.date) === month && (day.note !== null || day.relapsed))
    .reverse();
}

/** The month of the most recent note, or null when there is none. */
export function noteMonth(days: readonly DayEntry[]): MonthId | null {
  for (let i = days.length - 1; i >= 0; i--) if (days[i]!.note) return monthOf(days[i]!.date);
  return null;
}
