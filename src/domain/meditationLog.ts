import { v5 as uuidV5 } from 'uuid';

import { mondayIndex, monthWeeks, type MonthId } from './calendar';
import { addDays, daysBetween, type LocalDate } from './localDate';
import { MAX_GROWTH_DAYS } from './plant/grid';
import type { SpeciesId } from './plant/registry';
import type { Clock } from './ports';
import { err, ok, type Result } from './result';

// The meditation plant (ADR 0022): the days one meditated, kept. A plant
// grows one day for every day meditated and never dies: a day without
// meditation changes nothing, the plant waits. A gentle goal (so many days
// a week, never "every day"), and a run of days shown only while it lasts:
// nothing ever says it was lost.

/** A day one meditated: one row per day, whatever the number of sessions. */
export interface MeditationDay {
  /** Deterministic: derived from the date, see meditationDayIdFor(). */
  readonly id: string;
  readonly date: LocalDate;
  /** Whole minutes meditated that day, every session together. */
  readonly minutes: number;
  readonly sessions: number;
  /** Instant, ISO 8601 UTC. */
  readonly updatedAt: string;
}

/** UUID v5 namespace for meditation day ids. NEVER change it (see relapses). */
const MEDITATION_DAY_NAMESPACE = 'c2f4a8e1-6b3d-4e97-a0c5-1d8e7f2b9a64';

export function meditationDayIdFor(date: LocalDate): string {
  return uuidV5(`meditation/${date}`, MEDITATION_DAY_NAMESPACE);
}

/** The meditation plant: always the same jade, never dead, never watered. */
export const MEDITATION_PLANT: { species: SpeciesId; seed: number } = {
  species: 'jade',
  seed: 21,
};

/** Days a week one aims to meditate: a gentle goal, never every day by default. */
export const MEDITATION_GOAL = { min: 1, max: 7, initial: 5 } as const;

/** A session counts from one whole minute. */
export const MIN_MINUTES = 1;

export function clampGoal(goal: number): number {
  if (!Number.isFinite(goal)) return MEDITATION_GOAL.initial;
  return Math.min(MEDITATION_GOAL.max, Math.max(MEDITATION_GOAL.min, Math.round(goal)));
}

export type RecordMeditationError = 'TOO_SHORT';

/**
 * A session ended (finished or left): its whole minutes are added to the
 * day. Under a minute, nothing is kept.
 */
export function recordMeditation(params: {
  seconds: number;
  existing: MeditationDay | undefined;
  clock: Clock;
}): Result<MeditationDay, RecordMeditationError> {
  const minutes = Math.floor(Math.max(0, params.seconds) / 60);
  if (minutes < MIN_MINUTES) return err('TOO_SHORT');
  const date = params.clock.today();
  const before = params.existing;
  return ok({
    id: meditationDayIdFor(date),
    date,
    minutes: (before?.minutes ?? 0) + minutes,
    sessions: (before?.sessions ?? 0) + 1,
    updatedAt: params.clock.now(),
  });
}

export interface MeditationSummary {
  /** Every day meditated, ever. */
  days: number;
  minutes: number;
  /** The days of the plant: one per day meditated, up to a grown plant. */
  plantDays: number;
  /**
   * Days in a row, up to today (or up to yesterday while today is still
   * open). Shown only from 2: a broken run simply disappears.
   */
  run: number;
  /** This week, Monday first: which days were meditated, and the goal. */
  week: { meditated: boolean[]; done: number; goal: number };
}

export function meditationSummary(params: {
  days: readonly MeditationDay[];
  today: LocalDate;
  goal: number;
}): MeditationSummary {
  const dates = new Set(params.days.filter((day) => day.minutes > 0).map((day) => day.date));
  let run = 0;
  let cursor = dates.has(params.today) ? params.today : addDays(params.today, -1);
  while (dates.has(cursor)) {
    run++;
    cursor = addDays(cursor, -1);
  }
  const monday = addDays(params.today, -mondayIndex(params.today));
  const meditated = Array.from({ length: 7 }, (_, i) => dates.has(addDays(monday, i)));
  return {
    days: dates.size,
    minutes: params.days.reduce((sum, day) => sum + day.minutes, 0),
    plantDays: Math.min(MAX_GROWTH_DAYS, dates.size),
    run,
    week: {
      meditated,
      done: meditated.filter(Boolean).length,
      goal: clampGoal(params.goal),
    },
  };
}

export interface MeditationCalendarDay {
  date: LocalDate;
  dayOfMonth: number;
  /** Minutes meditated that day; null for a day without meditation. */
  entry: { minutes: number } | null;
  today: boolean;
  /** After today: nothing to show yet. */
  future: boolean;
}

/** One month of meditation, Monday first, for the calendar of the corner. */
export function meditationMonth(
  month: MonthId,
  days: readonly MeditationDay[],
  today: LocalDate,
): (MeditationCalendarDay | null)[][] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  return monthWeeks(month, today, (date) => {
    const day = byDate.get(date);
    return day && day.minutes > 0 ? { minutes: day.minutes } : null;
  }).map((week) =>
    week.map((cell) => (cell ? { ...cell, future: daysBetween(today, cell.date) > 0 } : null)),
  );
}
