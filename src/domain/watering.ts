import { v5 as uuidV5 } from 'uuid';

import type { Habit, HabitId } from './habit';
import { daysBetween, type LocalDate } from './localDate';
import type { Clock } from './ports';
import { err, ok, type Result } from './result';

/**
 * The plant was watered on that day: an optional gesture, never a duty. At
 * most one per habit and day. Nothing is ever lost by not watering.
 */
export interface Watering {
  /** Deterministic: derived from (habitId, date), see wateringIdFor(). */
  readonly id: string;
  readonly habitId: HabitId;
  readonly date: LocalDate;
  /** Instant, ISO 8601 UTC. */
  readonly updatedAt: string;
}

/** UUID v5 namespace for watering ids. NEVER change it (see relapses). */
const WATERING_ID_NAMESPACE = '7b1e9d40-2c6a-4f83-b5e2-9a0d4c7f1e26';

export function wateringIdFor(habitId: HabitId, date: LocalDate): string {
  return uuidV5(`${habitId}/${date}`, WATERING_ID_NAMESPACE);
}

export type WaterError = 'WATERING_IN_FUTURE' | 'WATERING_BEFORE_START';

export interface WaterParams {
  habit: Habit;
  date: LocalDate;
  existing: Watering | undefined;
  clock: Clock;
}

export function water({
  habit,
  date,
  existing,
  clock,
}: WaterParams): Result<{ change: 'created' | 'unchanged'; watering: Watering }, WaterError> {
  if (daysBetween(clock.today(), date) > 0) return err('WATERING_IN_FUTURE');
  if (daysBetween(habit.startDate, date) < 0) return err('WATERING_BEFORE_START');
  if (existing) return ok({ change: 'unchanged', watering: existing });
  return ok({
    change: 'created',
    watering: {
      id: wateringIdFor(habit.id, date),
      habitId: habit.id,
      date,
      updatedAt: clock.now(),
    },
  });
}
