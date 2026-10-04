import { v5 as uuidV5 } from 'uuid';

import type { Habit, HabitId } from './habit';
import { daysBetween, type LocalDate } from './localDate';
import type { Clock } from './ports';
import { err, ok, type Result } from './result';

export interface Relapse {
  /** Deterministic: derived from (habitId, date), see relapseIdFor(). */
  readonly id: string;
  readonly habitId: HabitId;
  readonly date: LocalDate;
  /** Instant, ISO 8601 UTC, when cancelled; null while active. */
  readonly deletedAt: string | null;
  /** Instant, ISO 8601 UTC, of the last state change. */
  readonly updatedAt: string;
}

/**
 * UUID v5 namespace for relapse ids. NEVER change it: every stored and
 * synced relapse id would stop matching the id recomputed from its data.
 */
const RELAPSE_ID_NAMESPACE = '86105bda-7e3d-45ae-8895-23fcdd03b0e7';

export function isActive(relapse: Relapse): boolean {
  return relapse.deletedAt === null;
}

/** UUID v5 of (habitId, date): identical on every device. */
export function relapseIdFor(habitId: HabitId, date: LocalDate): string {
  return uuidV5(`${habitId}/${date}`, RELAPSE_ID_NAMESPACE);
}

export type RecordRelapseError = 'RELAPSE_IN_FUTURE' | 'RELAPSE_BEFORE_START';

export interface RecordRelapseParams {
  habit: Habit;
  date: LocalDate;
  /** The stored relapse for (habit.id, date), active or cancelled, if any. */
  existing: Relapse | undefined;
  clock: Clock;
}

export interface RecordRelapseOutcome {
  change: 'created' | 'reactivated' | 'unchanged';
  relapse: Relapse;
}

export function recordRelapse(
  params: RecordRelapseParams,
): Result<RecordRelapseOutcome, RecordRelapseError> {
  const { habit, date, existing, clock } = params;

  if (existing && (existing.habitId !== habit.id || existing.date !== date)) {
    throw new Error(
      `existing relapse (${existing.habitId}, ${existing.date}) does not match (${habit.id}, ${date})`,
    );
  }

  if (daysBetween(clock.today(), date) > 0) return err('RELAPSE_IN_FUTURE');
  if (daysBetween(habit.startDate, date) < 0) return err('RELAPSE_BEFORE_START');

  if (existing === undefined) {
    return ok({
      change: 'created',
      relapse: {
        id: relapseIdFor(habit.id, date),
        habitId: habit.id,
        date,
        deletedAt: null,
        updatedAt: clock.now(),
      },
    });
  }

  if (isActive(existing)) return ok({ change: 'unchanged', relapse: existing });

  return ok({
    change: 'reactivated',
    relapse: { ...existing, deletedAt: null, updatedAt: clock.now() },
  });
}

export interface CancelRelapseOutcome {
  change: 'cancelled' | 'unchanged';
  relapse: Relapse;
}

export function cancelRelapse(relapse: Relapse, clock: Clock): CancelRelapseOutcome {
  if (!isActive(relapse)) return { change: 'unchanged', relapse };
  const now = clock.now();
  return { change: 'cancelled', relapse: { ...relapse, deletedAt: now, updatedAt: now } };
}
