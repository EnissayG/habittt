import type { LocalDate } from '../localDate';
import { windowView } from './windowView';

const OCTOBER = '2026-10-04' as LocalDate;
const JANUARY = '2027-01-15' as LocalDate;

describe('windowView', () => {
  it.each([
    [0, 'night'],
    [5, 'night'],
    [6, 'day'],
    [12, 'day'],
    [17, 'day'],
    [18, 'evening'],
    [20, 'evening'],
    [21, 'night'],
    [23, 'night'],
  ])('at %i h in October shows %s', (hour, view) => {
    expect(windowView(hour, OCTOBER)).toBe(view);
  });

  it('shows snow during the day in winter months only', () => {
    expect(windowView(12, JANUARY)).toBe('winter');
    expect(windowView(12, '2026-12-01' as LocalDate)).toBe('winter');
    expect(windowView(12, '2027-02-28' as LocalDate)).toBe('winter');
    expect(windowView(12, '2027-03-01' as LocalDate)).toBe('day');
    expect(windowView(12, '2026-11-30' as LocalDate)).toBe('day');
  });

  it('keeps evening and night views in winter', () => {
    expect(windowView(19, JANUARY)).toBe('evening');
    expect(windowView(22, JANUARY)).toBe('night');
  });
});
