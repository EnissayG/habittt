import { addDays, daysBetween, isLocalDate, parseLocalDate, type LocalDate } from './localDate';

const d = (value: string) => value as LocalDate;

describe('isLocalDate', () => {
  it.each(['2026-10-03', '2024-02-29', '2026-01-01', '2026-12-31'])('accepts %s', (value) => {
    expect(isLocalDate(value)).toBe(true);
  });

  it.each([
    ['', 'empty'],
    ['2026-1-3', 'missing zero padding'],
    ['26-10-03', 'two-digit year'],
    ['2026/10/03', 'wrong separator'],
    ['2026-10-03T00:00', 'time part'],
    [' 2026-10-03', 'leading space'],
    ['2026-13-01', 'month 13'],
    ['2026-00-10', 'month 0'],
    ['2026-04-31', 'April 31st'],
    ['2025-02-29', 'Feb 29th in a non-leap year'],
    ['2026-10-00', 'day 0'],
  ])('rejects %p (%s)', (value) => {
    expect(isLocalDate(value)).toBe(false);
  });
});

describe('parseLocalDate', () => {
  it('returns the same string for a valid date', () => {
    expect(parseLocalDate('2026-10-03')).toBe('2026-10-03');
  });

  it('throws on an invalid date, naming the value', () => {
    expect(() => parseLocalDate('2026-02-30')).toThrow('2026-02-30');
  });
});

describe('daysBetween', () => {
  it('is 0 for the same day', () => {
    expect(daysBetween(d('2026-10-03'), d('2026-10-03'))).toBe(0);
  });

  it('is positive forward and negative backward', () => {
    expect(daysBetween(d('2026-10-03'), d('2026-10-04'))).toBe(1);
    expect(daysBetween(d('2026-10-04'), d('2026-10-03'))).toBe(-1);
  });

  it('handles leap and non-leap Februaries', () => {
    expect(daysBetween(d('2024-02-28'), d('2024-03-01'))).toBe(2);
    expect(daysBetween(d('2025-02-28'), d('2025-03-01'))).toBe(1);
  });

  it('crosses a year boundary', () => {
    expect(daysBetween(d('2025-12-31'), d('2026-01-01'))).toBe(1);
    expect(daysBetween(d('2025-01-01'), d('2026-01-01'))).toBe(365);
  });

  // A day is not always 24 hours of local time. These ranges contain a
  // daylight-saving change in Europe or North America; the count must not
  // depend on the machine's time zone.
  it.each([
    ['2026-03-07', '2026-03-09'], // North America, spring forward
    ['2026-10-31', '2026-11-02'], // North America, fall back
    ['2026-03-28', '2026-03-30'], // Europe, spring forward
    ['2026-10-24', '2026-10-26'], // Europe, fall back
  ])('counts 2 days from %s to %s across a DST change', (from, to) => {
    expect(daysBetween(d(from), d(to))).toBe(2);
  });
});

describe('addDays', () => {
  it('adds and subtracts days', () => {
    expect(addDays(d('2026-10-03'), 1)).toBe('2026-10-04');
    expect(addDays(d('2026-10-03'), -3)).toBe('2026-09-30');
    expect(addDays(d('2026-10-03'), 0)).toBe('2026-10-03');
  });

  it('crosses month, leap day and year boundaries', () => {
    expect(addDays(d('2024-02-28'), 1)).toBe('2024-02-29');
    expect(addDays(d('2025-02-28'), 1)).toBe('2025-03-01');
    expect(addDays(d('2025-12-31'), 1)).toBe('2026-01-01');
  });

  it('is the inverse of daysBetween', () => {
    const from = d('2026-01-15');
    expect(daysBetween(from, addDays(from, 400))).toBe(400);
  });
});
