import { v5 as uuidV5 } from 'uuid';

import type { Habit, HabitId } from './habit';
import { daysBetween, type LocalDate } from './localDate';
import type { Clock } from './ports';
import { err, ok, type Result } from './result';

/** One mood per note, from the mockup's fixed list (labels live in the UI). */
export const MOODS = ['proud', 'craving', 'stress', 'easy'] as const;
export type Mood = (typeof MOODS)[number];

/** Longest note text, in characters. */
export const NOTE_MAX_LENGTH = 1000;

/** A dated note: at most one per habit and day, always optional, editable. */
export interface Note {
  /** Deterministic: derived from (habitId, date), see noteIdFor(). */
  readonly id: string;
  readonly habitId: HabitId;
  readonly date: LocalDate;
  readonly text: string;
  readonly mood: Mood | null;
  /** Instant, ISO 8601 UTC, when emptied; null while the note exists. */
  readonly deletedAt: string | null;
  /** Instant, ISO 8601 UTC, of the last change. */
  readonly updatedAt: string;
}

/**
 * UUID v5 namespace for note ids. NEVER change it: every stored and synced
 * note id would stop matching the id recomputed from its data.
 */
const NOTE_ID_NAMESPACE = '3f0c2a6e-5b8d-4e1f-9a7c-2d4b6e8f0a13';

export function noteIdFor(habitId: HabitId, date: LocalDate): string {
  return uuidV5(`${habitId}/${date}`, NOTE_ID_NAMESPACE);
}

export function isActiveNote(note: Note): boolean {
  return note.deletedAt === null;
}

export type WriteNoteError = 'NOTE_IN_FUTURE' | 'NOTE_BEFORE_START' | 'NOTE_TOO_LONG';

export interface WriteNoteParams {
  habit: Habit;
  date: LocalDate;
  text: string;
  mood: Mood | null;
  /** The stored note for (habit.id, date), active or deleted, if any. */
  existing: Note | undefined;
  clock: Clock;
}

export interface WriteNoteOutcome {
  change: 'created' | 'updated' | 'deleted' | 'unchanged';
  /** The note to save; undefined when there is nothing to store. */
  note: Note | undefined;
}

/**
 * Writes the note of a day. A note needs a text or a mood; emptying both
 * deletes it (soft delete, like relapses), writing again brings it back.
 */
export function writeNote(params: WriteNoteParams): Result<WriteNoteOutcome, WriteNoteError> {
  const { habit, date, mood, existing, clock } = params;
  if (existing && (existing.habitId !== habit.id || existing.date !== date)) {
    throw new Error(`existing note (${existing.habitId}, ${existing.date}) does not match`);
  }
  if (daysBetween(clock.today(), date) > 0) return err('NOTE_IN_FUTURE');
  if (daysBetween(habit.startDate, date) < 0) return err('NOTE_BEFORE_START');

  const text = params.text.replace(/\r\n?/g, '\n').trim();
  if (text.length > NOTE_MAX_LENGTH) return err('NOTE_TOO_LONG');
  const empty = text === '' && mood === null;

  if (empty) {
    if (!existing || !isActiveNote(existing)) return ok({ change: 'unchanged', note: existing });
    const now = clock.now();
    return ok({ change: 'deleted', note: { ...existing, deletedAt: now, updatedAt: now } });
  }

  if (!existing) {
    return ok({
      change: 'created',
      note: {
        id: noteIdFor(habit.id, date),
        habitId: habit.id,
        date,
        text,
        mood,
        deletedAt: null,
        updatedAt: clock.now(),
      },
    });
  }

  if (isActiveNote(existing) && existing.text === text && existing.mood === mood) {
    return ok({ change: 'unchanged', note: existing });
  }
  return ok({
    change: 'updated',
    note: { ...existing, text, mood, deletedAt: null, updatedAt: clock.now() },
  });
}
