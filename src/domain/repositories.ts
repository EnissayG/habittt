import type { Habit, HabitId } from './habit';
import type { LocalDate } from './localDate';
import type { Note } from './note';
import type { Relapse } from './relapse';
import type { Watering } from './watering';

/**
 * Persistence contracts, owned by the domain and implemented in src/data/.
 * save() is an upsert by id. Cancelling is a soft delete carried by the
 * entity itself; erasing a habit is the one hard delete (see erase()).
 */
export interface HabitRepository {
  getById(id: HabitId): Promise<Habit | undefined>;
  list(): Promise<Habit[]>;
  save(habit: Habit): Promise<void>;
  /**
   * Saves the trace of an erased habit and deletes, for real and at once,
   * everything that belongs to it (relapses, notes, waterings). The only
   * hard delete of the app: what was written must not survive an erase.
   */
  erase(trace: Habit): Promise<void>;
}

export interface RelapseRepository {
  /** All relapses of the habit, cancelled ones included (needed for sync). */
  listByHabit(habitId: HabitId): Promise<Relapse[]>;
  findByHabitAndDate(habitId: HabitId, date: LocalDate): Promise<Relapse | undefined>;
  save(relapse: Relapse): Promise<void>;
}

export interface NoteRepository {
  /** All notes of the habit, deleted ones included (needed for sync). */
  listByHabit(habitId: HabitId): Promise<Note[]>;
  findByHabitAndDate(habitId: HabitId, date: LocalDate): Promise<Note | undefined>;
  save(note: Note): Promise<void>;
}

export interface WateringRepository {
  listByHabit(habitId: HabitId): Promise<Watering[]>;
  findByHabitAndDate(habitId: HabitId, date: LocalDate): Promise<Watering | undefined>;
  save(watering: Watering): Promise<void>;
}
