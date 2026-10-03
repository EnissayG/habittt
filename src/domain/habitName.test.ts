import { normalizeHabitName } from './habitName';

describe('normalizeHabitName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeHabitName('  No smoking  ')).toBe('No smoking');
  });

  it('collapses internal whitespace runs', () => {
    expect(normalizeHabitName('No \t  sugar\n')).toBe('No sugar');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeHabitName('   ')).toBe('');
  });
});
