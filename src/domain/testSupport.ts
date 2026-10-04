// Test helpers shared by domain tests. Not imported by production code.
import type { Habit, HabitId } from './habit';
import type { LocalDate } from './localDate';
import type { Clock } from './ports';
import type { Relapse } from './relapse';
import type { HabitRepository, RelapseRepository } from './repositories';

export const TODAY = '2026-10-03' as LocalDate;
export const NOW = '2026-10-03T10:00:00.000Z';
export const LATER = '2026-10-03T18:30:00.000Z';

export function fixedClock(now: string = NOW, today: LocalDate = TODAY): Clock {
  return { now: () => now, today: () => today };
}

/**
 * Day relative to TODAY: day(0) is today, day(-1) yesterday, day(1) tomorrow.
 * Computed by hand (not with addDays) so tests do not depend on the code
 * they are testing.
 */
export function day(offset: number): LocalDate {
  const d = new Date(Date.UTC(2026, 9, 3 + offset));
  return d.toISOString().slice(0, 10) as LocalDate;
}

export function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'No smoking',
    seed: 42,
    startDate: day(-9),
    createdAt: NOW,
    ...overrides,
  };
}

/** Repositories backed by Maps, for use-case tests. */
export class InMemoryHabitRepository implements HabitRepository {
  readonly rows = new Map<HabitId, Habit>();
  async getById(id: HabitId) {
    return this.rows.get(id);
  }
  async list() {
    return [...this.rows.values()];
  }
  async save(habit: Habit) {
    this.rows.set(habit.id, habit);
  }
}

export class InMemoryRelapseRepository implements RelapseRepository {
  readonly rows = new Map<string, Relapse>();
  async listByHabit(habitId: HabitId) {
    return [...this.rows.values()].filter((relapse) => relapse.habitId === habitId);
  }
  async findByHabitAndDate(habitId: HabitId, date: LocalDate) {
    return [...this.rows.values()].find((r) => r.habitId === habitId && r.date === date);
  }
  async save(relapse: Relapse) {
    this.rows.set(relapse.id, relapse);
  }
}

export function makeRelapse(date: LocalDate, overrides: Partial<Relapse> = {}): Relapse {
  return {
    id: `relapse-${date}`,
    habitId: makeHabit().id,
    date,
    deletedAt: null,
    updatedAt: NOW,
    ...overrides,
  };
}
