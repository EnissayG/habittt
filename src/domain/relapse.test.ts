import { cancelRelapse, isActive, recordRelapse, relapseIdFor } from './relapse';
import { LATER, NOW, TODAY, day, fixedClock, makeHabit, makeRelapse } from './testSupport';

const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('relapseIdFor', () => {
  const habitId = makeHabit().id;

  it('returns a UUID v5', () => {
    expect(relapseIdFor(habitId, TODAY)).toMatch(UUID_V5);
  });

  it('matches the reference value (guards the namespace and name format)', () => {
    // Value cross-checked against both uuid builds (Node and React Native).
    // If this fails, stored and synced relapse ids would no longer match.
    expect(relapseIdFor(habitId, TODAY)).toBe('76e5882b-04f1-5d42-8610-b0dd5b3ed6d1');
  });

  it('is deterministic', () => {
    expect(relapseIdFor(habitId, TODAY)).toBe(relapseIdFor(habitId, TODAY));
  });

  it('differs by date and by habit', () => {
    const id = relapseIdFor(habitId, TODAY);
    expect(relapseIdFor(habitId, day(-1))).not.toBe(id);
    expect(relapseIdFor('33333333-3333-4333-8333-333333333333', TODAY)).not.toBe(id);
  });
});

describe('isActive', () => {
  it('is true until the relapse is cancelled', () => {
    expect(isActive(makeRelapse(TODAY))).toBe(true);
    expect(isActive(makeRelapse(TODAY, { deletedAt: NOW }))).toBe(false);
  });
});

describe('recordRelapse', () => {
  const habit = makeHabit({ startDate: day(-9) });

  it('creates a relapse for today', () => {
    const result = recordRelapse({ habit, date: TODAY, existing: undefined, clock: fixedClock() });

    expect(result).toEqual({
      ok: true,
      value: {
        change: 'created',
        relapse: {
          id: relapseIdFor(habit.id, TODAY),
          habitId: habit.id,
          date: TODAY,
          deletedAt: null,
          updatedAt: NOW,
        },
      },
    });
  });

  it('accepts the start date itself (lower bound included)', () => {
    const result = recordRelapse({
      habit,
      date: habit.startDate,
      existing: undefined,
      clock: fixedClock(),
    });
    expect(result.ok).toBe(true);
  });

  it('refuses a date in the future', () => {
    const result = recordRelapse({ habit, date: day(1), existing: undefined, clock: fixedClock() });
    expect(result).toEqual({ ok: false, error: 'RELAPSE_IN_FUTURE' });
  });

  it('refuses a date before the start date', () => {
    const result = recordRelapse({
      habit,
      date: day(-10),
      existing: undefined,
      clock: fixedClock(),
    });
    expect(result).toEqual({ ok: false, error: 'RELAPSE_BEFORE_START' });
  });

  it('does nothing when the day already has an active relapse', () => {
    const existing = makeRelapse(day(-1), { id: relapseIdFor(habit.id, day(-1)) });
    const result = recordRelapse({ habit, date: day(-1), existing, clock: fixedClock(LATER) });

    expect(result).toEqual({ ok: true, value: { change: 'unchanged', relapse: existing } });
  });

  it('reactivates a cancelled relapse on the same row', () => {
    const existing = makeRelapse(day(-1), {
      id: relapseIdFor(habit.id, day(-1)),
      deletedAt: NOW,
      updatedAt: NOW,
    });
    const result = recordRelapse({ habit, date: day(-1), existing, clock: fixedClock(LATER) });

    expect(result).toEqual({
      ok: true,
      value: {
        change: 'reactivated',
        relapse: { ...existing, deletedAt: null, updatedAt: LATER },
      },
    });
    expect(existing.deletedAt).toBe(NOW); // input not mutated
  });

  it('throws if `existing` does not match the habit and date (programming error)', () => {
    const existing = makeRelapse(day(-2));
    expect(() => recordRelapse({ habit, date: day(-1), existing, clock: fixedClock() })).toThrow(
      /existing/i,
    );
  });
});

describe('cancelRelapse', () => {
  it('soft-deletes an active relapse', () => {
    const relapse = makeRelapse(day(-1));
    const outcome = cancelRelapse(relapse, fixedClock(LATER));

    expect(outcome).toEqual({
      change: 'cancelled',
      relapse: { ...relapse, deletedAt: LATER, updatedAt: LATER },
    });
    expect(relapse.deletedAt).toBeNull(); // input not mutated
  });

  it('does nothing on an already cancelled relapse', () => {
    const relapse = makeRelapse(day(-1), { deletedAt: NOW, updatedAt: NOW });
    const outcome = cancelRelapse(relapse, fixedClock(LATER));

    expect(outcome).toEqual({ change: 'unchanged', relapse });
  });
});
