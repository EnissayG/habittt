import { createHabitTracker } from './habitTracker';
import { relapseIdFor } from './relapse';
import {
  InMemoryHabitRepository,
  InMemoryRelapseRepository,
  TODAY,
  day,
  fixedClock,
} from './testSupport';

function setup() {
  const habits = new InMemoryHabitRepository();
  const relapses = new InMemoryRelapseRepository();
  let nextId = 0;
  const tracker = createHabitTracker({
    habits,
    relapses,
    clock: fixedClock(),
    generateId: () => `habit-${++nextId}`,
    generateSeed: () => 7,
  });
  return { tracker, habits, relapses };
}

describe('habit tracker use cases', () => {
  it('adds a habit started some days ago and saves it', async () => {
    const { tracker, habits } = setup();
    const result = await tracker.addHabit({ name: 'No smoking', startedDaysAgo: 9 });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.startDate).toBe(day(-9));
    expect(habits.rows.size).toBe(1);
  });

  it('does not save a refused habit', async () => {
    const { tracker, habits } = setup();
    const result = await tracker.addHabit({ name: '  ', startedDaysAgo: 0 });

    expect(result).toEqual({ ok: false, error: 'NAME_EMPTY' });
    expect(habits.rows.size).toBe(0);
  });

  it('lists habits oldest first with their stats', async () => {
    const { tracker } = setup();
    await tracker.addHabit({ name: 'No smoking', startedDaysAgo: 9 });
    await tracker.addHabit({ name: 'No sugar', startedDaysAgo: 0 });

    const list = await tracker.listHabits();
    expect(list.map((s) => [s.habit.name, s.stats.currentStreak])).toEqual([
      ['No smoking', 10],
      ['No sugar', 1],
    ]);
  });

  it('toggles a relapse: record, cancel, then reactivate the same row', async () => {
    const { tracker, relapses } = setup();
    const added = await tracker.addHabit({ name: 'No smoking', startedDaysAgo: 9 });
    if (!added.ok) throw new Error('setup failed');
    const habitId = added.value.id;

    expect(await tracker.toggleRelapse(habitId, day(-1))).toEqual({ ok: true, value: 'recorded' });
    expect((await tracker.getHabit(habitId))?.stats.currentStreak).toBe(1);

    expect(await tracker.toggleRelapse(habitId, day(-1))).toEqual({
      ok: true,
      value: 'cancelled',
    });
    expect((await tracker.getHabit(habitId))?.stats.currentStreak).toBe(10);

    expect(await tracker.toggleRelapse(habitId, day(-1))).toEqual({ ok: true, value: 'recorded' });
    expect([...relapses.rows.keys()]).toEqual([relapseIdFor(habitId, day(-1))]);
  });

  it('refuses a relapse in the future and on an unknown habit', async () => {
    const { tracker } = setup();
    const added = await tracker.addHabit({ name: 'No smoking', startedDaysAgo: 0 });
    if (!added.ok) throw new Error('setup failed');

    expect(await tracker.toggleRelapse(added.value.id, day(1))).toEqual({
      ok: false,
      error: 'RELAPSE_IN_FUTURE',
    });
    expect(await tracker.toggleRelapse('missing', TODAY)).toEqual({
      ok: false,
      error: 'HABIT_NOT_FOUND',
    });
  });

  it('returns the day timeline with the habit detail', async () => {
    const { tracker } = setup();
    const added = await tracker.addHabit({ name: 'No smoking', startedDaysAgo: 2 });
    if (!added.ok) throw new Error('setup failed');
    await tracker.toggleRelapse(added.value.id, day(-1));

    const detail = await tracker.getHabit(added.value.id);
    expect(detail?.days.map((d) => d.relapsed)).toEqual([false, true, false]);
  });
});
