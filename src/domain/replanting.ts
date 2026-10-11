import { v5 as uuidV5 } from 'uuid';

import type { Habit, HabitId } from './habit';
import type { LocalDate } from './localDate';
import type { Clock } from './ports';
import { err, ok, type Result } from './result';

/**
 * A dead plant was replanted that day: a new life starts (see lives.ts).
 * At most one per habit and day; never cancelled (a mistaken relapse is
 * cancelled instead, which brings the old plant back).
 */
export interface Replanting {
  /** Deterministic: derived from (habitId, date), see replantingIdFor(). */
  readonly id: string;
  readonly habitId: HabitId;
  readonly date: LocalDate;
  /** Instant, ISO 8601 UTC. */
  readonly updatedAt: string;
}

/** UUID v5 namespace for replanting ids. NEVER change it (see relapses). */
const REPLANTING_ID_NAMESPACE = '751042eb-57a6-44bc-98ea-7fcfe1883fe0';

export function replantingIdFor(habitId: HabitId, date: LocalDate): string {
  return uuidV5(`${habitId}/${date}`, REPLANTING_ID_NAMESPACE);
}

/**
 * The seed of a plant replanted that day: FNV-1a (32 bits) of "habitId/date",
 * mixed by MurmurHash3's finalizer so that consecutive days differ widely.
 * NEVER change it: every replanted plant would be redrawn.
 */
export function replantSeed(habitId: HabitId, date: LocalDate): number {
  const text = `${habitId}/${date}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export type ReplantError = 'PLANT_ALIVE' | 'ALREADY_REPLANTED_TODAY';

export interface ReplantParams {
  habit: Habit;
  /** Whether the current life is over (see splitLives). */
  dead: boolean;
  /** The stored replanting of (habit.id, today), if any. */
  existing: Replanting | undefined;
  clock: Clock;
}

/** Replants a dead plant, today only. */
export function replant({
  habit,
  dead,
  existing,
  clock,
}: ReplantParams): Result<Replanting, ReplantError> {
  if (!dead) return err('PLANT_ALIVE');
  if (existing) return err('ALREADY_REPLANTED_TODAY');
  const date = clock.today();
  return ok({
    id: replantingIdFor(habit.id, date),
    habitId: habit.id,
    date,
    updatedAt: clock.now(),
  });
}
