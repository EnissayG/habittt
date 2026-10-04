import { toLocalDate } from './system';

jest.mock('expo-crypto', () => ({ getRandomValues: jest.fn(), randomUUID: jest.fn() }));

describe('toLocalDate', () => {
  it('uses the local calendar day, zero-padded', () => {
    // Constructed with local-time fields, so the expectation holds in any time zone.
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toLocalDate(new Date(2026, 9, 3, 0, 0))).toBe('2026-10-03');
  });
});
