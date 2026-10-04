import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'habittt.db';

/**
 * Ordered schema migrations. The database stores how many have run in
 * PRAGMA user_version. Never edit a shipped migration: append a new one.
 */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE habits (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    seed INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE relapses (
    id TEXT PRIMARY KEY NOT NULL,
    habit_id TEXT NOT NULL REFERENCES habits(id),
    date TEXT NOT NULL,
    deleted_at TEXT,
    updated_at TEXT NOT NULL,
    UNIQUE (habit_id, date)
  );
  `,
  // 2: plant species. SQLite needs a DEFAULT to add a NOT NULL column to a
  // table that has rows; existing habits are then spread over the four
  // first species by seed, once (the stored value never changes after).
  `
  ALTER TABLE habits ADD COLUMN species TEXT NOT NULL DEFAULT 'monstera';
  UPDATE habits SET species = CASE CAST(seed AS INTEGER) % 4
    WHEN 0 THEN 'monstera'
    WHEN 1 THEN 'pothos'
    WHEN 2 THEN 'calathea'
    ELSE 'jade'
  END;
  `,
];

export async function openHabitDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version] ?? '');
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
