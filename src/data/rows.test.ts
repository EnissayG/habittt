import type { Habit, LocalDate, Relapse } from '../domain';
import { habitFromRow, habitToRow, relapseFromRow, relapseToRow } from './rows';

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

describe('row mapping', () => {
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
