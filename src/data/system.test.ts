import { toLocalDate } from './system';

jest.mock('expo-crypto', () => ({ getRandomValues: jest.fn(), randomUUID: jest.fn() }));

describe('toLocalDate', () => {
  it('uses the local calendar day, zero-padded', () => {
    // Constructed with local-time fields, so the expectation holds in any time zone.
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toLocalDate(new Date(2026, 9, 3, 0, 0))).toBe('2026-10-03');
  });

  it('changes day exactly at local midnight', () => {
    expect(toLocalDate(new Date(2026, 9, 5, 23, 59, 59, 999))).toBe('2026-10-05');
    expect(toLocalDate(new Date(2026, 9, 6, 0, 0, 0, 0))).toBe('2026-10-06');
    expect(toLocalDate(new Date(2026, 11, 31, 23, 59, 59, 999))).toBe('2026-12-31');
    expect(toLocalDate(new Date(2027, 0, 1, 0, 0, 0, 0))).toBe('2027-01-01');
  });

  it('knows the leap day', () => {
    expect(toLocalDate(new Date(2024, 1, 29, 12))).toBe('2024-02-29');
    expect(toLocalDate(new Date(2024, 1, 29, 23, 59, 59, 999))).toBe('2024-02-29');
    expect(toLocalDate(new Date(2024, 2, 1, 0, 0))).toBe('2024-03-01');
  });
});
