import type { LocalDate } from '../domain';
import { splitNumbers, dayMonth, days, fromPickerDate, lowerFirst, toPickerDate } from './format';

describe('format', () => {
  const today = '2026-10-06' as LocalDate;

  it('writes French dates', () => {
    expect(dayMonth('2026-06-09' as LocalDate, today)).toBe('9 juin');
    expect(dayMonth('2026-10-01' as LocalDate, today)).toBe('1er octobre');
    expect(dayMonth('2026-08-15' as LocalDate, today)).toBe('15 août');
  });

  it('adds the year when it is not the current one', () => {
    expect(dayMonth('2024-02-28' as LocalDate, today)).toBe('28 février 2024');
    expect(dayMonth('2025-12-31' as LocalDate, '2026-01-01' as LocalDate)).toBe('31 décembre 2025');
    expect(dayMonth('2026-01-01' as LocalDate, '2026-01-01' as LocalDate)).toBe('1er janvier');
  });

  it('pluralizes days', () => {
    expect(days(1)).toBe('1 jour');
    expect(days(0)).toBe('0 jour');
    expect(days(87)).toBe('87 jours');
  });

  it('lowers the first letter, accents included', () => {
    expect(lowerFirst('Fumer')).toBe('fumer');
    expect(lowerFirst('Écrans')).toBe('écrans');
  });

  it('round-trips a date through the picker', () => {
    expect(fromPickerDate(toPickerDate('2026-12-31' as LocalDate))).toBe('2026-12-31');
  });
});

describe('splitNumbers', () => {
  it('cuts a text into runs of digits and runs of words', () => {
    expect(splitNumbers('Jour 87 · 1er octobre 2025')).toEqual([
      { text: 'Jour ', number: false },
      { text: '87', number: true },
      { text: ' · ', number: false },
      { text: '1', number: true },
      { text: 'er octobre ', number: false },
      { text: '2025', number: true },
    ]);
  });

  it('keeps a text without digits whole, and a bare number whole', () => {
    expect(splitNumbers('étagère')).toEqual([{ text: 'étagère', number: false }]);
    expect(splitNumbers('951')).toEqual([{ text: '951', number: true }]);
    expect(splitNumbers('')).toEqual([]);
  });
});
