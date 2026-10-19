import { buildExport, EXPORT_FORMAT } from './exportData';
import type { Note } from './note';
import type { Relapse } from './relapse';
import { day, LATER, makeHabit, NOW, TODAY } from './testSupport';

const habit = makeHabit({ id: 'h1', name: 'Fumer', startDate: day(-9) });

const relapse = (date: string, deletedAt: string | null = null): Relapse => ({
  id: `r-${date}`,
  habitId: 'h1',
  date: date as never,
  deletedAt,
  updatedAt: NOW,
});

const note = (date: string, text: string, deletedAt: string | null = null): Note => ({
  id: `n-${date}`,
  habitId: 'h1',
  date: date as never,
  text,
  mood: 'proud',
  deletedAt,
  updatedAt: NOW,
});

describe('buildExport', () => {
  it('writes every habit with what the person entered, active rows only, and its lives', () => {
    const data = buildExport({
      exportedAt: LATER,
      today: TODAY,
      habits: [
        {
          habit,
          relapses: [relapse(day(-5)), relapse(day(-3), LATER)],
          notes: [note(day(-5), 'Soirée difficile'), note(day(-4), '', LATER)],
          waterings: [{ id: 'w', habitId: 'h1', date: day(-6), updatedAt: NOW }],
          replantings: [{ id: 'p', habitId: 'h1', date: day(-5), updatedAt: NOW }],
        },
      ],
      meditation: { goal: 5, days: [] },
    });
    expect(data).toEqual({
      app: 'habittt',
      format: EXPORT_FORMAT,
      exportedAt: LATER,
      habits: [
        {
          id: 'h1',
          name: 'Fumer',
          species: habit.species,
          seed: habit.seed,
          startDate: day(-9),
          createdAt: habit.createdAt,
          status: 'shelf',
          retiredOn: null,
          relapses: [day(-5)],
          replantings: [day(-5)],
          waterings: [day(-6)],
          notes: [{ date: day(-5), text: 'Soirée difficile', mood: 'proud' }],
          lives: [
            { start: day(-9), end: day(-5), days: 4 },
            { start: day(-5), end: null, days: 5 },
          ],
        },
      ],
      meditation: { goal: 5, days: [] },
    });
  });

  it('leaves out erased habits, keeps given and retired ones', () => {
    const rows = { relapses: [], notes: [], waterings: [], replantings: [] };
    const data = buildExport({
      exportedAt: LATER,
      today: TODAY,
      habits: [
        { habit: makeHabit({ id: 'a', deletedAt: NOW, name: '' }), ...rows },
        { habit: makeHabit({ id: 'b', status: 'given', retiredOn: day(-1) }), ...rows },
        { habit: makeHabit({ id: 'c', status: 'garden', retiredOn: day(-2) }), ...rows },
      ],
      meditation: { goal: 5, days: [] },
    });
    expect(data.habits.map((h) => [h.id, h.status, h.retiredOn])).toEqual([
      ['b', 'given', day(-1)],
      ['c', 'garden', day(-2)],
    ]);
  });

  it('writes the days meditated, oldest first, and the weekly goal (format 2)', () => {
    const data = buildExport({
      exportedAt: LATER,
      today: TODAY,
      habits: [],
      meditation: {
        goal: 4,
        days: [
          { id: 'b', date: day(-1), minutes: 10, sessions: 1, updatedAt: NOW },
          { id: 'a', date: day(-3), minutes: 35, sessions: 2, updatedAt: NOW },
        ],
      },
    });
    expect(data.format).toBe(2);
    expect(data.meditation).toEqual({
      goal: 4,
      days: [
        { date: day(-3), minutes: 35, sessions: 2 },
        { date: day(-1), minutes: 10, sessions: 1 },
      ],
    });
  });
});
