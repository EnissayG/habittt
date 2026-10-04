import { daysBetween, type LocalDate } from './localDate';
import { isActive, type Relapse } from './relapse';

export interface HabitStats {
  /** Consecutive days without relapse ending on `today` (inclusive). */
  currentStreak: number;
  /** Longest run of consecutive days without relapse in [startDate, today]. */
  longestStreak: number;
  /** Days in [startDate, today], both ends included. */
  totalDays: number;
}

export interface ComputeStatsParams {
  startDate: LocalDate;
  /** Relapses of this habit; cancelled and out-of-range ones are ignored. */
  relapses: readonly Relapse[];
  today: LocalDate;
}

export function computeStats({ startDate, relapses, today }: ComputeStatsParams): HabitStats {
  const totalDays = daysBetween(startDate, today) + 1;
  if (totalDays <= 0) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };

  // Day indexes (0 = startDate) that hold an active relapse within range.
  const relapseDays = new Set(
    relapses
      .filter(isActive)
      .map((relapse) => daysBetween(startDate, relapse.date))
      .filter((index) => index >= 0 && index < totalDays),
  );

  // Walk the days once: a clean day extends the run, a relapse resets it.
  let run = 0;
  let longest = 0;
  for (let index = 0; index < totalDays; index++) {
    run = relapseDays.has(index) ? 0 : run + 1;
    longest = Math.max(longest, run);
  }

  return { currentStreak: run, longestStreak: longest, totalDays };
}
