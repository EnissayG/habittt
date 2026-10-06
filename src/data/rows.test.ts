import type { Habit, LocalDate, Note, Relapse, Watering } from '../domain';
import {
  habitFromRow,
  habitToRow,
  noteFromRow,
  noteToRow,
  relapseFromRow,
  relapseToRow,
  wateringFromRow,
  wateringToRow,
} from './rows';

const habit: Habit = {
  id: 'h1',
  name: 'No smoking',
  seed: 4294967295,
  species: 'pothos',
  startDate: '2026-09-24' as LocalDate,
  createdAt: '2026-10-03T10:00:00.000Z',
};

const relapse: Relapse = {
  id: 'r1',
  habitId: 'h1',
  date: '2026-10-02' as LocalDate,
  deletedAt: null,
  updatedAt: '2026-10-03T10:00:00.000Z',
};

const note: Note = {
  id: 'n1',
  habitId: 'h1',
  date: '2026-10-02' as LocalDate,
  text: 'Envie forte.\nPassée.',
  mood: 'craving',
  deletedAt: null,
  updatedAt: '2026-10-03T10:00:00.000Z',
};

const watering: Watering = {
  id: 'w1',
  habitId: 'h1',
  date: '2026-10-02' as LocalDate,
  updatedAt: '2026-10-03T10:00:00.000Z',
};

describe('row mapping', () => {
  it('round-trips a note, with or without a mood, and a watering', () => {
    expect(noteFromRow(noteToRow(note))).toEqual(note);
    expect(noteFromRow(noteToRow({ ...note, mood: null }))).toEqual({ ...note, mood: null });
    expect(wateringFromRow(wateringToRow(watering))).toEqual(watering);
  });

  it('reads an unknown mood as no mood', () => {
    expect(noteFromRow({ ...noteToRow(note), mood: 'joy-from-the-future' }).mood).toBeNull();
  });

  it('round-trips a habit', () => {
    expect(habitFromRow(habitToRow(habit))).toEqual(habit);
  });

  it('keeps an unknown species untouched (a newer app may have written it)', () => {
    const row = { ...habitToRow(habit), species: 'orchid-from-the-future' };
    const read = habitFromRow(row);
    expect(read.species).toBe('orchid-from-the-future');
    expect(habitToRow(read)).toEqual(row);
  });

  it('round-trips an active and a cancelled relapse', () => {
    expect(relapseFromRow(relapseToRow(relapse))).toEqual(relapse);
    const cancelled = { ...relapse, deletedAt: '2026-10-03T11:00:00.000Z' };
    expect(relapseFromRow(relapseToRow(cancelled))).toEqual(cancelled);
  });

  it('rejects a corrupted date coming from the database', () => {
    expect(() => habitFromRow({ ...habitToRow(habit), start_date: '2026-13-01' })).toThrow();
  });
});
