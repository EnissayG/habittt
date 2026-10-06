import { water, wateringIdFor } from './watering';
import { day, fixedClock, makeHabit, NOW, TODAY } from './testSupport';

const habit = makeHabit({ startDate: day(-9) });
const clock = fixedClock();

describe('water', () => {
  it('waters the plant on a day, with a deterministic id', () => {
    expect(water({ habit, date: TODAY, existing: undefined, clock })).toEqual({
      ok: true,
      value: {
        change: 'created',
        watering: {
          id: wateringIdFor(habit.id, TODAY),
          habitId: habit.id,
          date: TODAY,
          updatedAt: NOW,
        },
      },
    });
  });

  it('does nothing when the plant was already watered that day', () => {
    const first = water({ habit, date: TODAY, existing: undefined, clock });
    if (!first.ok) throw new Error('setup');
    const again = water({ habit, date: TODAY, existing: first.value.watering, clock });
    expect(again).toEqual({
      ok: true,
      value: { change: 'unchanged', watering: first.value.watering },
    });
  });

  it('refuses a day in the future or before the start', () => {
    expect(water({ habit, date: day(1), existing: undefined, clock })).toEqual({
      ok: false,
      error: 'WATERING_IN_FUTURE',
    });
    expect(water({ habit, date: day(-10), existing: undefined, clock })).toEqual({
      ok: false,
      error: 'WATERING_BEFORE_START',
    });
  });
});
