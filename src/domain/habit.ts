import { normalizeHabitName } from './habitName';
import { daysBetween, type LocalDate } from './localDate';
import { isSpeciesId, type SpeciesId } from './plant/registry';
import type { Clock, IdGenerator, SeedGenerator } from './ports';
import { err, ok, type Result } from './result';

export type HabitId = string;

export interface Habit {
  readonly id: HabitId;
  readonly name: string;
  /** Unsigned 32-bit integer, drawn once at creation; drives the plant. */
  readonly seed: number;
  /**
   * Plant species id, kept exactly as stored even if this app version does
   * not know it (synced from a newer one): saving the habit must never
   * replace it. Unknown ids are only substituted when drawing (renderPlant).
   */
  readonly species: string;
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
  /** Only known species can be chosen for a new habit. */
  species: SpeciesId;
}

export interface CreateHabitDeps {
  generateId: IdGenerator;
  generateSeed: SeedGenerator;
  clock: Clock;
}

/**
 * Checks a habit name on its own (the creation screen validates it before
 * the plant is chosen). Null when the name is valid.
 */
export function checkHabitName(raw: string): 'NAME_EMPTY' | 'NAME_TOO_LONG' | null {
  const name = normalizeHabitName(raw);
  if (name === '') return 'NAME_EMPTY';
  // Spread to count code points: '🌱'.length is 2 (UTF-16 code units).
  if ([...name].length > HABIT_NAME_MAX_LENGTH) return 'NAME_TOO_LONG';
  return null;
}

export function createHabit(
  input: CreateHabitInput,
  deps: CreateHabitDeps,
): Result<Habit, CreateHabitError> {
  if (!isSpeciesId(input.species)) {
    throw new Error(`Unknown species for a new habit: "${String(input.species)}"`);
  }

  const name = normalizeHabitName(input.name);
  const nameError = checkHabitName(name);
  if (nameError) return err(nameError);

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
    species: input.species,
    startDate: input.startDate,
    createdAt: deps.clock.now(),
  });
}
