import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Habit,
  HabitId,
  HabitRepository,
  LocalDate,
  Relapse,
  RelapseRepository,
} from '../domain';
import {
  habitFromRow,
  habitToRow,
  relapseFromRow,
  relapseToRow,
  type HabitRow,
  type RelapseRow,
} from './rows';

export class SqliteHabitRepository implements HabitRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getById(id: HabitId): Promise<Habit | undefined> {
    const row = await this.db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', id);
    return row ? habitFromRow(row) : undefined;
  }

  async list(): Promise<Habit[]> {
    const rows = await this.db.getAllAsync<HabitRow>('SELECT * FROM habits');
    return rows.map(habitFromRow);
  }

  async save(habit: Habit): Promise<void> {
    const row = habitToRow(habit);
    await this.db.runAsync(
      `INSERT INTO habits (id, name, seed, species, start_date, created_at)
       VALUES ($id, $name, $seed, $species, $start_date, $created_at)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         seed = excluded.seed,
         species = excluded.species,
         start_date = excluded.start_date,
         created_at = excluded.created_at`,
      {
        $id: row.id,
        $name: row.name,
        $seed: row.seed,
        $species: row.species,
        $start_date: row.start_date,
        $created_at: row.created_at,
      },
    );
  }
}

export class SqliteRelapseRepository implements RelapseRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async listByHabit(habitId: HabitId): Promise<Relapse[]> {
    const rows = await this.db.getAllAsync<RelapseRow>(
      'SELECT * FROM relapses WHERE habit_id = ? ORDER BY date',
      habitId,
    );
    return rows.map(relapseFromRow);
  }

  async findByHabitAndDate(habitId: HabitId, date: LocalDate): Promise<Relapse | undefined> {
    const row = await this.db.getFirstAsync<RelapseRow>(
      'SELECT * FROM relapses WHERE habit_id = ? AND date = ?',
      habitId,
      date,
    );
    return row ? relapseFromRow(row) : undefined;
  }

  async save(relapse: Relapse): Promise<void> {
    const row = relapseToRow(relapse);
    await this.db.runAsync(
      `INSERT INTO relapses (id, habit_id, date, deleted_at, updated_at)
       VALUES ($id, $habit_id, $date, $deleted_at, $updated_at)
       ON CONFLICT(id) DO UPDATE SET
         deleted_at = excluded.deleted_at,
         updated_at = excluded.updated_at`,
      {
        $id: row.id,
        $habit_id: row.habit_id,
        $date: row.date,
        $deleted_at: row.deleted_at,
        $updated_at: row.updated_at,
      },
    );
  }
}
