import type { Habit, HabitStatus } from './habit';
import type { LocalDate } from './localDate';
import type { Clock } from './ports';
import { err, ok, type Result } from './result';

// Taking a habit off the shelf, or erasing it. Both are kept as data: a
// retired plant stays readable (garden) or out of sight (given); an erased
// habit leaves a trace (its id and when) so that a later sync never brings
// it back. What belonged to it (relapses, notes, waterings) is deleted for
// real, for privacy, by the repository.

export type RetireError = 'HABIT_RETIRED' | 'HABIT_ERASED';

export function retireHabit(
  habit: Habit,
  to: Exclude<HabitStatus, 'shelf'>,
  clock: Clock,
): Result<Habit, RetireError> {
  if (habit.deletedAt !== null) return err('HABIT_ERASED');
  if (habit.status !== 'shelf') return err('HABIT_RETIRED');
  return ok({ ...habit, status: to, retiredOn: clock.today(), updatedAt: clock.now() });
}

/** The trace of an erased habit: its name goes, its plant data stay. */
export function eraseHabit(habit: Habit, clock: Clock): Habit {
  const now = clock.now();
  return { ...habit, name: '', deletedAt: now, updatedAt: now };
}

export function isOnShelf(habit: Habit): boolean {
  return habit.status === 'shelf' && habit.deletedAt === null;
}

/** The last day a plant grows: today on the shelf, the day it left otherwise. */
export function growthEnd(habit: Habit, today: LocalDate): LocalDate {
  return habit.retiredOn ?? today;
}
