import { addDays, daysBetween, type LocalDate } from './localDate';
import { isActive, type Relapse } from './relapse';

export interface DayEntry {
  /** 0 for startDate; stable position of the day in the plant. */
  index: number;
  date: LocalDate;
  relapsed: boolean;
}

export interface BuildTimelineParams {
  startDate: LocalDate;
  relapses: readonly Relapse[];
  today: LocalDate;
}

/** One entry per day in [startDate, today], oldest first. */
export function buildTimeline({ startDate, relapses, today }: BuildTimelineParams): DayEntry[] {
  const dayCount = daysBetween(startDate, today) + 1;
  if (dayCount <= 0) return [];

  const relapseDates = new Set(relapses.filter(isActive).map((relapse) => relapse.date));

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(startDate, index);
    return { index, date, relapsed: relapseDates.has(date) };
  });
}
