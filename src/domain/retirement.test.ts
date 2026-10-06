import { eraseHabit, growthEnd, isOnShelf, retireHabit } from './retirement';
import { LATER, TODAY, day, fixedClock, makeHabit } from './testSupport';

const clock = fixedClock(LATER);

describe('retireHabit', () => {
  it.each(['garden', 'given'] as const)('sends a plant of the shelf to %s, today', (to) => {
    const habit = makeHabit();
    expect(retireHabit(habit, to, clock)).toEqual({
      ok: true,
      value: { ...habit, status: to, retiredOn: TODAY, updatedAt: LATER },
    });
  });

  it('refuses a plant already retired, or erased', () => {
    const garden = makeHabit({ status: 'garden', retiredOn: day(-2) });
    expect(retireHabit(garden, 'given', clock)).toEqual({ ok: false, error: 'HABIT_RETIRED' });
    const erased = eraseHabit(makeHabit(), clock);
    expect(retireHabit(erased, 'garden', clock)).toEqual({ ok: false, error: 'HABIT_ERASED' });
  });
});

describe('eraseHabit', () => {
  it('keeps only a trace: the id, its plant data and when it was erased; the name goes', () => {
    const habit = makeHabit({ status: 'garden', retiredOn: day(-2) });
    expect(eraseHabit(habit, clock)).toEqual({
      ...habit,
      name: '',
      deletedAt: LATER,
      updatedAt: LATER,
    });
  });

  it('works from the shelf as well', () => {
    expect(eraseHabit(makeHabit(), clock).deletedAt).toBe(LATER);
  });
});

describe('growthEnd and isOnShelf', () => {
  it('lets a plant of the shelf grow up to today', () => {
    expect(growthEnd(makeHabit(), TODAY)).toBe(TODAY);
    expect(isOnShelf(makeHabit())).toBe(true);
  });

  it('stops a retired plant on the day it was retired', () => {
    const habit = makeHabit({ status: 'garden', retiredOn: day(-4) });
    expect(growthEnd(habit, TODAY)).toBe(day(-4));
    expect(isOnShelf(habit)).toBe(false);
  });

  it('never puts an erased habit on the shelf', () => {
    expect(isOnShelf(eraseHabit(makeHabit(), clock))).toBe(false);
  });
});
