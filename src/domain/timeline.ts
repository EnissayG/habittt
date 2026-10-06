import { addDays, daysBetween, type LocalDate } from './localDate';
import { isActiveNote, type Note } from './note';
import { isActive, type Relapse } from './relapse';
import type { Watering } from './watering';

export interface DayEntry {
  /** 0 for startDate; stable position of the day in the plant. */
  index: number;
  date: LocalDate;
  relapsed: boolean;
  /** The day's note, if it has one. */
  note: Note | null;
  watered: boolean;
}

export interface BuildTimelineParams {
  startDate: LocalDate;
  relapses: readonly Relapse[];
  notes?: readonly Note[];
  waterings?: readonly Watering[];
  today: LocalDate;
}

/** One entry per day in [startDate, today], oldest first. */
export function buildTimeline({
  startDate,
  relapses,
  notes = [],
  waterings = [],
  today,
}: BuildTimelineParams): DayEntry[] {
  const dayCount = daysBetween(startDate, today) + 1;
  if (dayCount <= 0) return [];

  const relapseDates = new Set(relapses.filter(isActive).map((relapse) => relapse.date));
  const notesByDate = new Map(notes.filter(isActiveNote).map((note) => [note.date, note]));
  const wateredDates = new Set(waterings.map((watering) => watering.date));

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      index,
      date,
      relapsed: relapseDates.has(date),
      note: notesByDate.get(date) ?? null,
      watered: wateredDates.has(date),
    };
  });
}
