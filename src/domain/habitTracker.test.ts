import { createHabitTracker } from './habitTracker';
import { SPECIES_IDS } from './plant/registry';
import { MAX_GROWTH_DAYS } from './plant/grid';
import { renderPlant } from './plant/renderPlant';
import { relapseIdFor } from './relapse';
import {
  InMemoryHabitRepository,
  InMemoryRelapseRepository,
  TODAY,
  day,
  fixedClock,
} from './testSupport';

function setup(hour = 10) {
  const habits = new InMemoryHabitRepository();
  const relapses = new InMemoryRelapseRepository();
  let nextId = 0;
  const tracker = createHabitTracker({
    habits,
    relapses,
    clock: fixedClock(undefined, undefined, hour),
    generateId: () => `habit-${++nextId}`,
    generateSeed: () => 7,
  });
  return { tracker, habits, relapses };
}

describe('habit tracker use cases', () => {
  it('adds a habit started on a past date and saves it', async () => {
    const { tracker, habits } = setup();
    const result = await tracker.addHabit({ name: 'No smoking', startDate: day(-9) });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.startDate).toBe(day(-9));
    expect(habits.rows.size).toBe(1);
  });

  it('keeps the chosen species', async () => {
    const { tracker } = setup();
    const result = await tracker.addHabit({
      name: 'No smoking',
      startDate: TODAY,
      species: 'calathea',
    });
    expect(result.ok && result.value.species).toBe('calathea');
  });

  it('draws a species from the injected generator when none is chosen', async () => {
    const { tracker } = setup();
    // generateSeed() returns 7 here: the species is SPECIES_IDS[7 % count].
    const result = await tracker.addHabit({ name: 'No smoking', startDate: TODAY });
    expect(result.ok && result.value.species).toBe(SPECIES_IDS[7 % SPECIES_IDS.length]);
  });

  it('does not save a refused habit', async () => {
    const { tracker, habits } = setup();
    const result = await tracker.addHabit({ name: '  ', startDate: TODAY });

    expect(result).toEqual({ ok: false, error: 'NAME_EMPTY' });
    expect(habits.rows.size).toBe(0);
  });

  it('lists habits oldest first with their stats', async () => {
    const { tracker } = setup();
    await tracker.addHabit({ name: 'No smoking', startDate: day(-9) });
    await tracker.addHabit({ name: 'No sugar', startDate: TODAY });

    const list = await tracker.listHabits();
    expect(list.map((s) => [s.habit.name, s.stats.currentStreak])).toEqual([
      ['No smoking', 10],
      ['No sugar', 1],
    ]);
  });

  it('toggles a relapse: record, cancel, then reactivate the same row', async () => {
    const { tracker, relapses } = setup();
    const added = await tracker.addHabit({ name: 'No smoking', startDate: day(-9) });
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
    const added = await tracker.addHabit({ name: 'No smoking', startDate: TODAY });
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

  it('returns the plant drawn from the habit and its relapses', async () => {
    const { tracker } = setup();
    const added = await tracker.addHabit({
      name: 'No smoking',
      startDate: day(-2),
      species: 'pothos',
    });
    if (!added.ok) throw new Error('setup failed');
    await tracker.toggleRelapse(added.value.id, day(-1)); // day 2 of the plant

    const detail = await tracker.getHabit(added.value.id);
    expect(detail?.plant).toEqual(
      renderPlant({
        species: 'pothos',
        seed: added.value.seed,
        elapsedDays: 3,
        relapseDays: [2],
      }),
    );
  });

  it('returns the day timeline with the habit detail', async () => {
    const { tracker } = setup();
    const added = await tracker.addHabit({ name: 'No smoking', startDate: day(-2) });
    if (!added.ok) throw new Error('setup failed');
    await tracker.toggleRelapse(added.value.id, day(-1));

    const detail = await tracker.getHabit(added.value.id);
    expect(detail?.days.map((d) => d.relapsed)).toEqual([false, true, false]);
  });

  it('records a relapse without ever cancelling it', async () => {
    const { tracker } = setup();
    const added = await tracker.addHabit({ name: 'No smoking', startDate: day(-9) });
    if (!added.ok) throw new Error('setup failed');
    const id = added.value.id;

    expect(await tracker.recordRelapse(id, TODAY)).toEqual({ ok: true, value: 'recorded' });
    expect(await tracker.recordRelapse(id, TODAY)).toEqual({ ok: true, value: 'unchanged' });
    expect((await tracker.getHabit(id))?.stats.currentStreak).toBe(0);
    expect(await tracker.recordRelapse(id, day(1))).toEqual({
      ok: false,
      error: 'RELAPSE_IN_FUTURE',
    });
    expect(await tracker.recordRelapse('missing', TODAY)).toEqual({
      ok: false,
      error: 'HABIT_NOT_FOUND',
    });
  });

  it('gives today from the injected clock', () => {
    expect(setup().tracker.today()).toBe(TODAY);
  });

  describe('getShelf', () => {
    it('arranges habits and totals the clean days', async () => {
      const { tracker } = setup();
      const a = await tracker.addHabit({ name: 'Smoking', startDate: day(-9), species: 'cactus' });
      const b = await tracker.addHabit({ name: 'Sugar', startDate: day(-2), species: 'fern' });
      if (!a.ok || !b.ok) throw new Error('setup failed');
      await tracker.recordRelapse(a.value.id, day(-1));

      const shelf = await tracker.getShelf();
      expect(shelf.totals).toEqual({ plants: 2, cleanDays: 9 + 3 });
      expect(Object.keys(shelf.habits).sort()).toEqual([a.value.id, b.value.id].sort());
      expect(shelf.layout.walls).toHaveLength(1);
    });

    it('chooses the window view from the clock and draws the window', async () => {
      const day10 = await setup(10).tracker.getShelf();
      const night = await setup(23).tracker.getShelf();
      expect(day10.view).toBe('day');
      expect(night.view).toBe('night');
      expect(night.window.pixels.length).toBeGreaterThan(0);
    });
  });

  describe('openingPlant', () => {
    it('shows a grown bonsai when there is no habit', async () => {
      expect(await setup().tracker.openingPlant()).toEqual(
        renderPlant({ species: 'bonsai', seed: 12, elapsedDays: MAX_GROWTH_DAYS, relapseDays: [] }),
      );
    });

    it("shows the oldest habit's plant", async () => {
      const { tracker } = setup();
      const added = await tracker.addHabit({ name: 'A', startDate: day(-5), species: 'aloe' });
      if (!added.ok) throw new Error('setup failed');
      expect((await tracker.openingPlant()).species).toBe('aloe');
    });
  });
});
