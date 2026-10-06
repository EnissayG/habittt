import { journalMonths, monthCalendar, monthEntries, monthOf, noteMonth } from './calendar';
import type { LocalDate } from './localDate';
import type { Note } from './note';
import { buildTimeline } from './timeline';
import type { Relapse } from './relapse';

const d = (value: string) => value as LocalDate;

const relapse = (date: string): Relapse => ({
  id: `r-${date}`,
  habitId: 'h',
  date: d(date),
  deletedAt: null,
  updatedAt: '2026-10-01T10:00:00.000Z',
});

const note = (date: string, text = 'Un mot'): Note => ({
  id: `n-${date}`,
  habitId: 'h',
  date: d(date),
  text,
  mood: null,
  deletedAt: null,
  updatedAt: '2026-10-01T10:00:00.000Z',
});

// Started on Saturday 2026-08-29, today Tuesday 2026-10-06.
const TODAY = d('2026-10-06');
const days = buildTimeline({
  startDate: d('2026-08-29'),
  relapses: [relapse('2026-09-10'), relapse('2026-10-02')],
  notes: [note('2026-09-03'), note('2026-09-10', 'Soirée difficile'), note('2026-10-05')],
  today: TODAY,
});

describe('monthOf and journalMonths', () => {
  it('names a month by its year and number', () => {
    expect(monthOf(d('2026-10-06'))).toBe('2026-10');
  });

  it('lists every month from the start to the end, oldest first, across a year', () => {
    expect(journalMonths(d('2026-08-29'), TODAY)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(journalMonths(d('2025-11-30'), d('2026-02-01'))).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
    expect(journalMonths(TODAY, TODAY)).toEqual(['2026-10']);
  });
});

describe('monthCalendar', () => {
  it('lays a month out in weeks starting on Monday, blanks around it', () => {
    // October 2026 starts on a Thursday and has 31 days.
    const weeks = monthCalendar('2026-10', days, TODAY);
    expect(weeks).toHaveLength(5);
    for (const week of weeks) expect(week).toHaveLength(7);
    expect(weeks[0]!.slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0]![3]!.dayOfMonth).toBe(1);
    expect(weeks[4]![5]!.dayOfMonth).toBe(31);
    expect(weeks[4]![6]).toBeNull();
    expect(weeks.flat().filter((cell) => cell !== null)).toHaveLength(31);
  });

  it('gives each day of the period its entry, and none outside it', () => {
    const cells = monthCalendar('2026-10', days, TODAY).flat();
    const cell = (day: number) => cells.find((c) => c?.dayOfMonth === day)!;
    expect(cell(2).entry?.relapsed).toBe(true);
    expect(cell(5).entry?.note?.text).toBe('Un mot');
    expect(cell(6).entry?.index).toBe(38);
    expect(cell(7).entry).toBeNull();
    const august = monthCalendar('2026-08', days, TODAY).flat();
    expect(august.find((c) => c?.dayOfMonth === 28)!.entry).toBeNull();
    expect(august.find((c) => c?.dayOfMonth === 29)!.entry?.index).toBe(0);
  });

  it('marks today, and only today', () => {
    const cells = monthCalendar('2026-10', days, TODAY)
      .flat()
      .filter((c) => c?.today);
    expect(cells.map((c) => c!.date)).toEqual([TODAY]);
  });

  it('handles February and a month starting on Monday', () => {
    // February 2027 starts on a Monday and has 28 days: exactly four weeks.
    const weeks = monthCalendar('2027-02', [], d('2027-02-10'));
    expect(weeks).toHaveLength(4);
    expect(weeks[0]![0]!.dayOfMonth).toBe(1);
    expect(monthCalendar('2028-02', [], d('2028-02-10')).flat().filter(Boolean)).toHaveLength(29);
  });
});

describe('monthEntries and noteMonth', () => {
  it('lists the month’s days with a note or a relapse, newest first', () => {
    expect(monthEntries('2026-09', days).map((day) => day.date)).toEqual([
      '2026-09-10',
      '2026-09-03',
    ]);
    expect(monthEntries('2026-10', days).map((day) => day.date)).toEqual([
      '2026-10-05',
      '2026-10-02',
    ]);
    expect(monthEntries('2026-08', days)).toEqual([]);
  });

  it('finds the month of the most recent note', () => {
    expect(noteMonth(days)).toBe('2026-10');
    expect(noteMonth(days.slice(0, 20))).toBe('2026-09');
    expect(noteMonth(days.slice(0, 3))).toBeNull();
  });
});
