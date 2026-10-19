import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Habit,
  HabitId,
  HabitRepository,
  LocalDate,
  MeditationDay,
  MeditationRepository,
  Note,
  NoteRepository,
  Relapse,
  RelapseRepository,
  Replanting,
  ReplantingRepository,
  SettingKey,
  SettingsRepository,
  Watering,
  WateringRepository,
} from '../domain';
import {
  habitFromRow,
  habitToRow,
  meditationDayFromRow,
  meditationDayToRow,
  noteFromRow,
  noteToRow,
  relapseFromRow,
  relapseToRow,
  replantingFromRow,
  replantingToRow,
  settingsFromRows,
  wateringFromRow,
  wateringToRow,
  type HabitRow,
  type MeditationDayRow,
  type NoteRow,
  type RelapseRow,
  type ReplantingRow,
  type SettingRow,
  type WateringRow,
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
      `INSERT INTO habits (id, name, seed, species, start_date, created_at,
         status, retired_on, updated_at, deleted_at)
       VALUES ($id, $name, $seed, $species, $start_date, $created_at,
         $status, $retired_on, $updated_at, $deleted_at)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         seed = excluded.seed,
         species = excluded.species,
         start_date = excluded.start_date,
         created_at = excluded.created_at,
         status = excluded.status,
         retired_on = excluded.retired_on,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at`,
      {
        $id: row.id,
        $name: row.name,
        $seed: row.seed,
        $species: row.species,
        $start_date: row.start_date,
        $created_at: row.created_at,
        $status: row.status,
        $retired_on: row.retired_on,
        $updated_at: row.updated_at,
        $deleted_at: row.deleted_at,
      },
    );
  }

  async erase(trace: Habit): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      for (const table of ['relapses', 'notes', 'waterings', 'replantings']) {
        await this.db.runAsync(`DELETE FROM ${table} WHERE habit_id = ?`, trace.id);
      }
      await this.save(trace);
    });
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

export class SqliteNoteRepository implements NoteRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async listByHabit(habitId: HabitId): Promise<Note[]> {
    const rows = await this.db.getAllAsync<NoteRow>(
      'SELECT * FROM notes WHERE habit_id = ? ORDER BY date',
      habitId,
    );
    return rows.map(noteFromRow);
  }

  async findByHabitAndDate(habitId: HabitId, date: LocalDate): Promise<Note | undefined> {
    const row = await this.db.getFirstAsync<NoteRow>(
      'SELECT * FROM notes WHERE habit_id = ? AND date = ?',
      habitId,
      date,
    );
    return row ? noteFromRow(row) : undefined;
  }

  async save(note: Note): Promise<void> {
    const row = noteToRow(note);
    await this.db.runAsync(
      `INSERT INTO notes (id, habit_id, date, text, mood, deleted_at, updated_at)
       VALUES ($id, $habit_id, $date, $text, $mood, $deleted_at, $updated_at)
       ON CONFLICT(id) DO UPDATE SET
         text = excluded.text,
         mood = excluded.mood,
         deleted_at = excluded.deleted_at,
         updated_at = excluded.updated_at`,
      {
        $id: row.id,
        $habit_id: row.habit_id,
        $date: row.date,
        $text: row.text,
        $mood: row.mood,
        $deleted_at: row.deleted_at,
        $updated_at: row.updated_at,
      },
    );
  }
}

export class SqliteWateringRepository implements WateringRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async listByHabit(habitId: HabitId): Promise<Watering[]> {
    const rows = await this.db.getAllAsync<WateringRow>(
      'SELECT * FROM waterings WHERE habit_id = ? ORDER BY date',
      habitId,
    );
    return rows.map(wateringFromRow);
  }

  async findByHabitAndDate(habitId: HabitId, date: LocalDate): Promise<Watering | undefined> {
    const row = await this.db.getFirstAsync<WateringRow>(
      'SELECT * FROM waterings WHERE habit_id = ? AND date = ?',
      habitId,
      date,
    );
    return row ? wateringFromRow(row) : undefined;
  }

  async save(watering: Watering): Promise<void> {
    const row = wateringToRow(watering);
    await this.db.runAsync(
      `INSERT INTO waterings (id, habit_id, date, updated_at)
       VALUES ($id, $habit_id, $date, $updated_at)
       ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
      { $id: row.id, $habit_id: row.habit_id, $date: row.date, $updated_at: row.updated_at },
    );
  }
}

export class SqliteReplantingRepository implements ReplantingRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async listByHabit(habitId: HabitId): Promise<Replanting[]> {
    const rows = await this.db.getAllAsync<ReplantingRow>(
      'SELECT * FROM replantings WHERE habit_id = ? ORDER BY date',
      habitId,
    );
    return rows.map(replantingFromRow);
  }

  async findByHabitAndDate(habitId: HabitId, date: LocalDate): Promise<Replanting | undefined> {
    const row = await this.db.getFirstAsync<ReplantingRow>(
      'SELECT * FROM replantings WHERE habit_id = ? AND date = ?',
      habitId,
      date,
    );
    return row ? replantingFromRow(row) : undefined;
  }

  async save(replanting: Replanting): Promise<void> {
    const row = replantingToRow(replanting);
    await this.db.runAsync(
      `INSERT INTO replantings (id, habit_id, date, updated_at)
       VALUES ($id, $habit_id, $date, $updated_at)
       ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
      { $id: row.id, $habit_id: row.habit_id, $date: row.date, $updated_at: row.updated_at },
    );
  }
}

export class SqliteMeditationRepository implements MeditationRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async list(): Promise<MeditationDay[]> {
    const rows = await this.db.getAllAsync<MeditationDayRow>(
      'SELECT * FROM meditation_days ORDER BY date',
    );
    return rows.map(meditationDayFromRow);
  }

  async findByDate(date: LocalDate): Promise<MeditationDay | undefined> {
    const row = await this.db.getFirstAsync<MeditationDayRow>(
      'SELECT * FROM meditation_days WHERE date = ?',
      date,
    );
    return row ? meditationDayFromRow(row) : undefined;
  }

  async save(day: MeditationDay): Promise<void> {
    const row = meditationDayToRow(day);
    await this.db.runAsync(
      `INSERT INTO meditation_days (id, date, minutes, sessions, updated_at)
       VALUES ($id, $date, $minutes, $sessions, $updated_at)
       ON CONFLICT(id) DO UPDATE SET
         minutes = excluded.minutes,
         sessions = excluded.sessions,
         updated_at = excluded.updated_at`,
      {
        $id: row.id,
        $date: row.date,
        $minutes: row.minutes,
        $sessions: row.sessions,
        $updated_at: row.updated_at,
      },
    );
  }
}

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly now: () => string,
  ) {}

  async readAll(): Promise<Partial<Record<SettingKey, string>>> {
    return settingsFromRows(
      await this.db.getAllAsync<SettingRow>('SELECT key, value FROM settings'),
    );
  }

  async write(key: SettingKey, value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO settings (key, value, updated_at) VALUES ($key, $value, $updated_at)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      { $key: key, $value: value, $updated_at: this.now() },
    );
  }
}
