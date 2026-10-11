import {
  replantingIdFor,
  type Habit,
  type LocalDate,
  type Note,
  type Relapse,
  type Replanting,
  type Watering,
} from '../domain';
import {
  habitFromRow,
  habitToRow,
  noteFromRow,
  noteToRow,
  relapseFromRow,
  relapseToRow,
  replantingFromRow,
  replantingsForRelapses,
  replantingToRow,
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
  status: 'shelf',
  retiredOn: null,
  updatedAt: '2026-10-03T10:00:00.000Z',
  deletedAt: null,
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

  it('round-trips a habit, on the shelf, retired or erased', () => {
    expect(habitFromRow(habitToRow(habit))).toEqual(habit);
    const garden: Habit = {
      ...habit,
      status: 'garden',
      retiredOn: '2026-10-01' as LocalDate,
      updatedAt: '2026-10-01T09:00:00.000Z',
    };
    expect(habitFromRow(habitToRow(garden))).toEqual(garden);
    const erased: Habit = { ...garden, name: '', deletedAt: '2026-10-02T09:00:00.000Z' };
    expect(habitFromRow(habitToRow(erased))).toEqual(erased);
  });

  it('reads an unknown status as the garden: kept in view, never written to', () => {
    expect(habitFromRow({ ...habitToRow(habit), status: 'compost-from-the-future' }).status).toBe(
      'garden',
    );
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

  it('round-trips a replanting', () => {
    const replanting: Replanting = {
      id: 'p1',
      habitId: 'h1',
      date: '2026-10-02' as LocalDate,
      updatedAt: '2026-10-03T10:00:00.000Z',
    };
    expect(replantingFromRow(replantingToRow(replanting))).toEqual(replanting);
  });
});

describe('replantingsForRelapses (migration 5)', () => {
  it('replants on the day of every active relapse, so that no plant dies at the update', () => {
    const rows = [
      relapseToRow(relapse),
      relapseToRow({ ...relapse, id: 'r2', date: '2026-09-30' as LocalDate, deletedAt: 'x' }),
    ];
    expect(replantingsForRelapses(rows)).toEqual([
      {
        id: replantingIdFor('h1', '2026-10-02' as LocalDate),
        habit_id: 'h1',
        date: '2026-10-02',
        updated_at: relapse.updatedAt,
      },
    ]);
  });
});
