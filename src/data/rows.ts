import {
  MOODS,
  parseLocalDate,
  type Habit,
  type Mood,
  type Note,
  type Relapse,
  type Watering,
} from '../domain';

// SQLite rows use snake_case; mapping is kept here, separate from queries,
// so it can be unit-tested without a database.

export interface HabitRow {
  id: string;
  name: string;
  seed: number;
  species: string;
  start_date: string;
  created_at: string;
}

export interface RelapseRow {
  id: string;
  habit_id: string;
  date: string;
  deleted_at: string | null;
  updated_at: string;
}

export function habitFromRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    seed: row.seed,
    species: row.species,
    startDate: parseLocalDate(row.start_date),
    createdAt: row.created_at,
  };
}

export function habitToRow(habit: Habit): HabitRow {
  return {
    id: habit.id,
    name: habit.name,
    seed: habit.seed,
    species: habit.species,
    start_date: habit.startDate,
    created_at: habit.createdAt,
  };
}

export function relapseFromRow(row: RelapseRow): Relapse {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: parseLocalDate(row.date),
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
  };
}

export function relapseToRow(relapse: Relapse): RelapseRow {
  return {
    id: relapse.id,
    habit_id: relapse.habitId,
    date: relapse.date,
    deleted_at: relapse.deletedAt,
    updated_at: relapse.updatedAt,
  };
}

export interface NoteRow {
  id: string;
  habit_id: string;
  date: string;
  text: string;
  mood: string | null;
  deleted_at: string | null;
  updated_at: string;
}

export interface WateringRow {
  id: string;
  habit_id: string;
  date: string;
  updated_at: string;
}

/** An unknown mood (written by a newer app) is read as no mood. */
function moodFromRow(mood: string | null): Mood | null {
  return (MOODS as readonly string[]).includes(mood ?? '') ? (mood as Mood) : null;
}

export function noteFromRow(row: NoteRow): Note {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: parseLocalDate(row.date),
    text: row.text,
    mood: moodFromRow(row.mood),
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
  };
}

export function noteToRow(note: Note): NoteRow {
  return {
    id: note.id,
    habit_id: note.habitId,
    date: note.date,
    text: note.text,
    mood: note.mood,
    deleted_at: note.deletedAt,
    updated_at: note.updatedAt,
  };
}

export function wateringFromRow(row: WateringRow): Watering {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: parseLocalDate(row.date),
    updatedAt: row.updated_at,
  };
}

export function wateringToRow(watering: Watering): WateringRow {
  return {
    id: watering.id,
    habit_id: watering.habitId,
    date: watering.date,
    updated_at: watering.updatedAt,
  };
}
