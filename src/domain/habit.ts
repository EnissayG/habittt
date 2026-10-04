import { normalizeHabitName } from './habitName';
import { daysBetween, type LocalDate } from './localDate';
import type { Clock, IdGenerator, SeedGenerator } from './ports';
import { err, ok, type Result } from './result';

export type HabitId = string;

export interface Habit {
  readonly id: HabitId;
  readonly name: string;
  /** Unsigned 32-bit integer, drawn once at creation; drives the plant. */
  readonly seed: number;
  readonly startDate: LocalDate;
  /** Instant, ISO 8601 UTC. */
  readonly createdAt: string;
}

export const HABIT_NAME_MAX_LENGTH = 50;

const MAX_SEED = 2 ** 32 - 1;

export type CreateHabitError = 'NAME_EMPTY' | 'NAME_TOO_LONG' | 'START_DATE_IN_FUTURE';

export interface CreateHabitInput {
  name: string;
  startDate: LocalDate;
}

export interface CreateHabitDeps {
  generateId: IdGenerator;
  generateSeed: SeedGenerator;
  clock: Clock;
}

export function createHabit(
  input: CreateHabitInput,
  deps: CreateHabitDeps,
): Result<Habit, CreateHabitError> {
  const name = normalizeHabitName(input.name);
  if (name === '') return err('NAME_EMPTY');
  // Spread to count code points: '🌱'.length is 2 (UTF-16 code units).
  if ([...name].length > HABIT_NAME_MAX_LENGTH) return err('NAME_TOO_LONG');

  if (daysBetween(deps.clock.today(), input.startDate) > 0) return err('START_DATE_IN_FUTURE');

  // Generators are only called once every rule has passed.
  const seed = deps.generateSeed();
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new RangeError(`Seed generator returned ${seed}; expected an integer in [0, 2^32 - 1]`);
  }

  return ok({
    id: deps.generateId(),
    name,
    seed,
    startDate: input.startDate,
    createdAt: deps.clock.now(),
  });
}
