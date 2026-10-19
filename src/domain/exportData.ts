import type { Habit, HabitStatus } from './habit';
import { splitLives } from './lives';
import type { LocalDate } from './localDate';
import type { MeditationDay } from './meditationLog';
import { isActiveNote, type Mood, type Note } from './note';
import { isActive, type Relapse } from './relapse';
import type { Replanting } from './replanting';
import { growthEnd } from './retirement';
import type { Watering } from './watering';

// "Exporter mes données": everything the person entered, readable and
// complete enough to be read back later. Erased habits are left out (only a
// trace of them remains); given and retired ones are kept. Cancelled
// relapses and deleted notes are left out too.

/** Raise it whenever the shape below changes. */
export const EXPORT_FORMAT = 2;

export interface ExportedHabit {
  id: string;
  name: string;
  species: string;
  seed: number;
  startDate: LocalDate;
  createdAt: string;
  status: HabitStatus;
  retiredOn: LocalDate | null;
  relapses: LocalDate[];
  replantings: LocalDate[];
  waterings: LocalDate[];
  notes: { date: LocalDate; text: string; mood: Mood | null }[];
  lives: { start: LocalDate; end: LocalDate | null; days: number }[];
}

export interface ExportData {
  app: 'habittt';
  format: number;
  exportedAt: string;
  habits: ExportedHabit[];
  /** Format 2: the days meditated and the weekly goal (ADR 0022). */
  meditation: { goal: number; days: { date: LocalDate; minutes: number; sessions: number }[] };
}

export interface HabitRows {
  habit: Habit;
  relapses: readonly Relapse[];
  notes: readonly Note[];
  waterings: readonly Watering[];
  replantings: readonly Replanting[];
}

const dates = (rows: readonly { date: LocalDate }[]) => rows.map((row) => row.date).sort();

export function buildExport(params: {
  exportedAt: string;
  today: LocalDate;
  habits: readonly HabitRows[];
  meditation: { goal: number; days: readonly MeditationDay[] };
}): ExportData {
  return {
    app: 'habittt',
    format: EXPORT_FORMAT,
    exportedAt: params.exportedAt,
    habits: params.habits
      .filter(({ habit }) => habit.deletedAt === null)
      .map(({ habit, relapses, notes, waterings, replantings }) => ({
        id: habit.id,
        name: habit.name,
        species: habit.species,
        seed: habit.seed,
        startDate: habit.startDate,
        createdAt: habit.createdAt,
        status: habit.status,
        retiredOn: habit.retiredOn,
        relapses: dates(relapses.filter(isActive)),
        replantings: dates(replantings),
        waterings: dates(waterings),
        notes: notes
          .filter(isActiveNote)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(({ date, text, mood }) => ({ date, text, mood })),
        lives: splitLives({
          habit,
          relapses,
          replantings,
          today: growthEnd(habit, params.today),
        }).map(({ start, end, days }) => ({ start, end, days })),
      })),
    meditation: {
      goal: params.meditation.goal,
      days: [...params.meditation.days]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(({ date, minutes, sessions }) => ({ date, minutes, sessions })),
    },
  };
}
