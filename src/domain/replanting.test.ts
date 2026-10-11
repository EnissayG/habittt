import { replant, replantingIdFor, replantSeed } from './replanting';
import { fixedClock, LATER, makeHabit, TODAY, day } from './testSupport';

const habit = makeHabit();
const clock = fixedClock(LATER);

describe('replantSeed', () => {
  it('is a 32-bit unsigned integer drawn from the habit and the day', () => {
    const seed = replantSeed(habit.id, TODAY);
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(2 ** 32 - 1);
    expect(replantSeed(habit.id, TODAY)).toBe(seed);
    expect(replantSeed(habit.id, day(-1))).not.toBe(seed);
    expect(replantSeed('another-habit', TODAY)).not.toBe(seed);
  });

  it('never changes: the same plant on every device, in every version', () => {
    expect(replantSeed('11111111-1111-4111-8111-111111111111', '2026-10-03' as never)).toBe(
      PINNED_SEED,
    );
  });

  it('spreads the seeds of consecutive days', () => {
    const seeds = new Set(Array.from({ length: 365 }, (_, i) => replantSeed(habit.id, day(-i))));
    expect(seeds.size).toBe(365);
  });
});

describe('replant', () => {
  it('replants a dead plant today', () => {
    expect(replant({ habit, dead: true, existing: undefined, clock })).toEqual({
      ok: true,
      value: {
        id: replantingIdFor(habit.id, TODAY),
        habitId: habit.id,
        date: TODAY,
        updatedAt: LATER,
      },
    });
  });

  it('refuses a living plant, and a second replanting the same day', () => {
    expect(replant({ habit, dead: false, existing: undefined, clock })).toEqual({
      ok: false,
      error: 'PLANT_ALIVE',
    });
    const existing = { id: 'x', habitId: habit.id, date: TODAY, updatedAt: LATER };
    expect(replant({ habit, dead: true, existing, clock })).toEqual({
      ok: false,
      error: 'ALREADY_REPLANTED_TODAY',
    });
  });

  it('derives the id from the habit and the day, like relapses', () => {
    expect(replantingIdFor(habit.id, TODAY)).toBe(replantingIdFor(habit.id, TODAY));
    expect(replantingIdFor(habit.id, TODAY)).not.toBe(replantingIdFor(habit.id, day(-1)));
    expect(replantingIdFor(habit.id, TODAY)).toMatch(/^[0-9a-f-]{36}$/);
  });
});

/** Pinned on purpose: changing replantSeed would redraw every replanted plant. */
const PINNED_SEED = 3151622760;
