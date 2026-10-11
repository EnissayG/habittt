import { record, splitLives } from './lives';
import type { LocalDate } from './localDate';
import type { Relapse } from './relapse';
import { replantSeed, type Replanting } from './replanting';
import { day, makeHabit, TODAY } from './testSupport';

const habit = makeHabit({ startDate: day(-20), seed: 42 });

const relapse = (date: LocalDate, cancelled = false): Relapse => ({
  id: `r-${date}`,
  habitId: habit.id,
  date,
  deletedAt: cancelled ? '2026-10-03T12:00:00.000Z' : null,
  updatedAt: '2026-10-03T10:00:00.000Z',
});

const replanting = (date: LocalDate): Replanting => ({
  id: `p-${date}`,
  habitId: habit.id,
  date,
  updatedAt: '2026-10-03T10:00:00.000Z',
});

const lives = (relapses: Relapse[] = [], replantings: Replanting[] = [], today = TODAY) =>
  splitLives({ habit, relapses, replantings, today });

describe('splitLives', () => {
  it('gives a habit without relapse one living plant, from its start to today', () => {
    expect(lives()).toEqual([
      {
        index: 0,
        seed: 42,
        start: day(-20),
        firstDay: day(-20),
        end: null,
        days: 21,
        dead: false,
      },
    ]);
  });

  it('ends the life on a relapse: the plant is dead, it held the days before', () => {
    const [life, ...rest] = lives([relapse(day(-5))]);
    expect(rest).toEqual([]);
    expect(life).toMatchObject({ end: day(-5), days: 15, dead: true });
  });

  it('kills the plant on its first day when the relapse is on the start day', () => {
    expect(lives([relapse(day(-20))])[0]).toMatchObject({ days: 0, dead: true });
  });

  it('starts a new life at a replanting, with its own seed, counting from the next day', () => {
    const result = lives([relapse(day(-5))], [replanting(day(-5))]);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      index: 1,
      seed: replantSeed(habit.id, day(-5)),
      start: day(-5),
      firstDay: day(-4),
      end: null,
      days: 5,
      dead: false,
    });
  });

  it('shows a counter of 0 on the day of the replanting', () => {
    const result = lives([relapse(day(-2))], [replanting(day(0))]);
    expect(result[1]).toMatchObject({ start: TODAY, days: 0, dead: false });
  });

  it('keeps the plant dead between the relapse and a later replanting', () => {
    const result = lives([relapse(day(-5))], [replanting(day(-1))]);
    expect(result[0]).toMatchObject({ end: day(-5), days: 15, dead: true });
    expect(result[1]).toMatchObject({ start: day(-1), firstDay: day(0), days: 1 });
  });

  it('lets a relapse kill the next life, and a relapse while dead does nothing', () => {
    const result = lives(
      [relapse(day(-15)), relapse(day(-13)), relapse(day(-8))],
      [replanting(day(-12))],
    );
    expect(result.map((life) => [life.start, life.end, life.days, life.dead])).toEqual([
      [day(-20), day(-15), 5, true],
      [day(-12), day(-8), 3, true],
    ]);
  });

  it('never ends a life with a relapse of its replanting day (it belongs to the life before)', () => {
    const result = lives([relapse(day(-6)), relapse(day(-3))], [replanting(day(-3))]);
    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ start: day(-3), end: null, days: 3, dead: false });
  });

  it('brings the plant back to life when the relapse is cancelled', () => {
    const result = lives([relapse(day(-5), true)], [replanting(day(-5))]);
    expect(result).toEqual(lives());
  });

  it('ignores a replanting made while the plant was alive', () => {
    const result = lives([relapse(day(-3))], [replanting(day(-10))]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ seed: 42, end: day(-3), dead: true });
  });

  it('ends the first life earlier when a forgotten relapse is added before', () => {
    const before = lives([relapse(day(-5))], [replanting(day(-5))]);
    const after = lives([relapse(day(-12)), relapse(day(-5))], [replanting(day(-5))]);
    expect(before[0]).toMatchObject({ end: day(-5), days: 15 });
    expect(after[0]).toMatchObject({ end: day(-12), days: 8 });
    // The relapse of day -5 now falls while the plant is dead: the replanting still counts.
    expect(after[1]).toEqual(before[1]);
  });

  it('stops at the given last day (a retired plant)', () => {
    expect(lives([], [], day(-10))[0]).toMatchObject({ days: 11, dead: false });
  });
});

describe('record', () => {
  it('is the most days held by one life', () => {
    expect(record(lives([relapse(day(-15)), relapse(day(-8))], [replanting(day(-15))]))).toBe(6);
    expect(record(lives())).toBe(21);
  });
});
