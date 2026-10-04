import type { LocalDate } from './localDate';
import type { Relapse } from './relapse';
import { computeStats, type HabitStats } from './stats';
import { LATER, NOW, TODAY, day, makeRelapse } from './testSupport';

const d = (value: string) => value as LocalDate;

// The validated edge cases. D = startDate, A = today.
//   [#, description, startDate, relapses, today, expected]
const cases: [number, string, LocalDate, Relapse[], LocalDate, HabitStats][] = [
  [1, 'start day, no relapse', TODAY, [], TODAY, stats(1, 1, 1)],
  [2, 'start day, relapse today', TODAY, [makeRelapse(TODAY)], TODAY, stats(0, 0, 1)],
  [3, 'D = A-9, no relapse', day(-9), [], TODAY, stats(10, 10, 10)],
  [4, 'D = A-9, relapse today', day(-9), [makeRelapse(TODAY)], TODAY, stats(0, 9, 10)],
  [5, 'D = A-9, relapse yesterday', day(-9), [makeRelapse(day(-1))], TODAY, stats(1, 8, 10)],
  [6, 'D = A-9, relapse on start day', day(-9), [makeRelapse(day(-9))], TODAY, stats(9, 9, 10)],
  [
    7,
    'D = A-9, relapse yesterday cancelled',
    day(-9),
    [makeRelapse(day(-1), { deletedAt: NOW, updatedAt: NOW })],
    TODAY,
    stats(10, 10, 10),
  ],
  [
    8,
    'D = A-9, relapse yesterday cancelled then reactivated',
    day(-9),
    [makeRelapse(day(-1), { deletedAt: null, updatedAt: LATER })],
    TODAY,
    stats(1, 8, 10),
  ],
  [9, 'D = A-9, relapse at A-4', day(-9), [makeRelapse(day(-4))], TODAY, stats(4, 5, 10)],
  [
    10,
    'D = A-9, relapses at A-2 and A-1',
    day(-9),
    [makeRelapse(day(-2)), makeRelapse(day(-1))],
    TODAY,
    stats(1, 7, 10),
  ],
  [
    11,
    'D = A-2, relapse every day',
    day(-2),
    [makeRelapse(day(-2)), makeRelapse(day(-1)), makeRelapse(TODAY)],
    TODAY,
    stats(0, 0, 3),
  ],
  [12, 'D = A-60, no relapse', day(-60), [], TODAY, stats(61, 61, 61)],
  [13, 'leap year month boundary', d('2024-02-28'), [], d('2024-03-01'), stats(3, 3, 3)],
  [14, 'year boundary', d('2025-12-31'), [], d('2026-01-01'), stats(2, 2, 2)],
  [15, 'today before start date', TODAY, [], day(-1), stats(0, 0, 0)],
  [16, 'relapse after today is ignored', day(-9), [makeRelapse(day(1))], TODAY, stats(10, 10, 10)],
  [
    17,
    'relapse before start date is ignored',
    day(-9),
    [makeRelapse(day(-10))],
    TODAY,
    stats(10, 10, 10),
  ],
];

function stats(currentStreak: number, longestStreak: number, totalDays: number): HabitStats {
  return { currentStreak, longestStreak, totalDays };
}

describe('computeStats', () => {
  it.each(cases)('case %i: %s', (_n, _label, startDate, relapses, today, expected) => {
    expect(computeStats({ startDate, relapses, today })).toEqual(expected);
  });

  it('does not depend on the order of relapses', () => {
    const relapses = [makeRelapse(day(-1)), makeRelapse(day(-6)), makeRelapse(day(-3))];
    const forward = computeStats({ startDate: day(-9), relapses, today: TODAY });
    const backward = computeStats({
      startDate: day(-9),
      relapses: [...relapses].reverse(),
      today: TODAY,
    });
    expect(backward).toEqual(forward);
  });
});
