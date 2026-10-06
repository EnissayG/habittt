import type { LocalDate } from '../domain';
import { dayMonth, days, fromPickerDate, lowerFirst, toPickerDate } from './format';

describe('format', () => {
  it('writes French dates', () => {
    expect(dayMonth('2026-06-09' as LocalDate)).toBe('9 juin');
    expect(dayMonth('2026-10-01' as LocalDate)).toBe('1er octobre');
    expect(dayMonth('2026-08-15' as LocalDate)).toBe('15 août');
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
