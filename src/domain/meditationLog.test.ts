import {
  clampGoal,
  MEDITATION_GOAL,
  meditationDayIdFor,
  meditationMonth,
  meditationSummary,
  recordMeditation,
  type MeditationDay,
} from './meditationLog';
import { MAX_GROWTH_DAYS } from './plant/grid';
import { day, fixedClock, LATER, NOW, TODAY } from './testSupport';

// TODAY (2026-10-03) is a Saturday: its week starts on day(-5).

const meditated = (offset: number, minutes = 10, sessions = 1): MeditationDay => ({
  id: meditationDayIdFor(day(offset)),
  date: day(offset),
  minutes,
  sessions,
  updatedAt: NOW,
});

describe('recordMeditation', () => {
  it('keeps today from one whole minute, with a stable id per day', () => {
    const result = recordMeditation({ seconds: 125, existing: undefined, clock: fixedClock() });
    expect(result).toEqual({
      ok: true,
      value: {
        id: meditationDayIdFor(TODAY),
        date: TODAY,
        minutes: 2,
        sessions: 1,
        updatedAt: NOW,
      },
    });
    expect(meditationDayIdFor(TODAY)).toBe(meditationDayIdFor(TODAY));
    expect(meditationDayIdFor(TODAY)).not.toBe(meditationDayIdFor(day(-1)));
  });

  it('adds a second session of the day to the first', () => {
    const result = recordMeditation({
      seconds: 600,
      existing: meditated(0, 5),
      clock: fixedClock(LATER),
    });
    expect(result.ok && result.value).toMatchObject({ minutes: 15, sessions: 2, updatedAt: LATER });
  });

  it('keeps nothing under a minute', () => {
    expect(recordMeditation({ seconds: 59.9, existing: undefined, clock: fixedClock() })).toEqual({
      ok: false,
      error: 'TOO_SHORT',
    });
    expect(recordMeditation({ seconds: -5, existing: undefined, clock: fixedClock() }).ok).toBe(
      false,
    );
  });
});

describe('meditationSummary', () => {
  const summary = (days: MeditationDay[], goal = 5) =>
    meditationSummary({ days, today: TODAY, goal });

  it('starts empty: an empty pot, nothing to show', () => {
    expect(summary([])).toEqual({
      days: 0,
      minutes: 0,
      plantDays: 0,
      run: 0,
      week: { meditated: [false, false, false, false, false, false, false], done: 0, goal: 5 },
    });
  });

  it('grows the plant one day per day meditated, never beyond a grown plant', () => {
    expect(summary([meditated(-30), meditated(-2), meditated(0)]).plantDays).toBe(3);
    const many = Array.from({ length: 150 }, (_, i) => meditated(-i));
    expect(summary(many).plantDays).toBe(MAX_GROWTH_DAYS);
    expect(summary(many).days).toBe(150);
  });

  it('counts this week from Monday, against the goal', () => {
    const week = summary([meditated(-6), meditated(-5), meditated(-3), meditated(0)], 3).week;
    expect(week.meditated).toEqual([true, false, true, false, false, true, false]);
    expect(week.done).toBe(3);
    expect(week.goal).toBe(3);
  });

  it('counts the days in a row up to today, or up to yesterday while today is open', () => {
    expect(summary([meditated(-2), meditated(-1), meditated(0)]).run).toBe(3);
    expect(summary([meditated(-3), meditated(-2), meditated(-1)]).run).toBe(3);
    // A day missed before yesterday: the run is simply gone, nothing else changes.
    expect(summary([meditated(-4), meditated(-3), meditated(-2)]).run).toBe(0);
    expect(summary([meditated(-4), meditated(-3), meditated(-2)]).plantDays).toBe(3);
  });

  it('adds up the minutes', () => {
    expect(summary([meditated(-1, 30), meditated(0, 5)]).minutes).toBe(35);
  });
});

describe('clampGoal', () => {
  it('keeps the goal between one and seven days, whole', () => {
    expect(clampGoal(0)).toBe(MEDITATION_GOAL.min);
    expect(clampGoal(9)).toBe(MEDITATION_GOAL.max);
    expect(clampGoal(3.4)).toBe(3);
    expect(clampGoal(NaN)).toBe(MEDITATION_GOAL.initial);
  });
});

describe('meditationMonth', () => {
  it('marks the days meditated in a Monday-first month, and what is still to come', () => {
    const weeks = meditationMonth('2026-10', [meditated(-1, 12), meditated(-40)], TODAY);
    // October 2026 starts on a Thursday.
    expect(weeks[0]!.slice(0, 3)).toEqual([null, null, null]);
    const cells = weeks.flat().filter((cell) => cell !== null);
    expect(cells).toHaveLength(31);
    const byDate = Object.fromEntries(cells.map((cell) => [cell!.date, cell!]));
    expect(byDate[day(-1)]!.entry).toEqual({ minutes: 12 });
    expect(byDate[day(0)]!).toMatchObject({ entry: null, today: true, future: false });
    expect(byDate[day(1)]!.future).toBe(true);
    expect(cells.filter((cell) => cell!.entry)).toHaveLength(1);
  });
});
