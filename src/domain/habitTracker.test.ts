import { createHabitTracker } from './habitTracker';
import { SPECIES_IDS } from './plant/registry';
import { MAX_GROWTH_DAYS } from './plant/grid';
import { renderPlant } from './plant/renderPlant';
import { relapseIdFor } from './relapse';
import {
  InMemoryHabitRepository,
  InMemoryNoteRepository,
  InMemoryRelapseRepository,
  InMemoryWateringRepository,
  TODAY,
  day,
  fixedClock,
} from './testSupport';

function setup(hour = 10) {
  const habits = new InMemoryHabitRepository();
  const relapses = new InMemoryRelapseRepository();
  const notes = new InMemoryNoteRepository();
  const waterings = new InMemoryWateringRepository();
  let nextId = 0;
  const tracker = createHabitTracker({
    habits,
    relapses,
    notes,
    waterings,
    clock: fixedClock(undefined, undefined, hour),
    generateId: () => `habit-${++nextId}`,
    generateSeed: () => 7,
  });
  return { tracker, habits, relapses, notes, waterings };
}

async function withHabit(startOffset = -9) {
  const context = setup();
  const added = await context.tracker.addHabit({ name: 'Fumer', startDate: day(startOffset) });
  if (!added.ok) throw new Error('setup failed');
  return { ...context, id: added.value.id };
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
    it('arranges habits and totals the current streaks, as shown under the plants', async () => {
      const { tracker } = setup();
      const a = await tracker.addHabit({ name: 'Smoking', startDate: day(-9), species: 'cactus' });
      const b = await tracker.addHabit({ name: 'Sugar', startDate: day(-2), species: 'fern' });
      if (!a.ok || !b.ok) throw new Error('setup failed');
      await tracker.recordRelapse(a.value.id, day(-1));

      const shelf = await tracker.getShelf();
      // Smoking: relapse yesterday, 1 day in a row; Sugar: 3 days in a row.
      expect(shelf.totals).toEqual({ plants: 2, currentDays: 1 + 3 });
      expect(Object.keys(shelf.habits).sort()).toEqual([a.value.id, b.value.id].sort());
      expect(shelf.layout.walls.map((wall) => wall.kind)).toEqual(['plants', 'plants', 'decor']);
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
    const bonsai = renderPlant({
      species: 'bonsai',
      seed: 12,
      elapsedDays: MAX_GROWTH_DAYS,
      relapseDays: [],
    });

    it('shows a grown bonsai when there is no habit', async () => {
      expect(await setup().tracker.openingPlant()).toEqual(bonsai);
    });

    it('shows the same bonsai whatever the habits are', async () => {
      const { tracker } = setup();
      const added = await tracker.addHabit({ name: 'A', startDate: day(-5), species: 'aloe' });
      if (!added.ok) throw new Error('setup failed');
      expect(await tracker.openingPlant()).toEqual(bonsai);
    });
  });

  describe('notes and watering', () => {
    it('saves the note of a past day, then updates and deletes it', async () => {
      const { tracker, id, notes } = await withHabit();
      expect(await tracker.saveNote(id, day(-3), { text: 'Dur.', mood: 'stress' })).toEqual({
        ok: true,
        value: 'created',
      });
      expect(await tracker.saveNote(id, day(-3), { text: 'Moins dur.', mood: null })).toEqual({
        ok: true,
        value: 'updated',
      });
      expect(await tracker.saveNote(id, day(-3), { text: ' ', mood: null })).toEqual({
        ok: true,
        value: 'deleted',
      });
      expect([...notes.rows.values()]).toHaveLength(1);
    });

    it('refuses a note for an unknown habit or an impossible day, saving nothing', async () => {
      const { tracker, id, notes } = await withHabit();
      expect(await tracker.saveNote('nope', TODAY, { text: 'x', mood: null })).toEqual({
        ok: false,
        error: 'HABIT_NOT_FOUND',
      });
      expect(await tracker.saveNote(id, day(1), { text: 'x', mood: null })).toEqual({
        ok: false,
        error: 'NOTE_IN_FUTURE',
      });
      expect(notes.rows.size).toBe(0);
    });

    it('waters today, with or without a note, once a day', async () => {
      const { tracker, id, notes, waterings: stored } = await withHabit();
      expect(await tracker.waterToday(id)).toEqual({
        ok: true,
        value: { watering: 'created', note: null },
      });
      expect(await tracker.waterToday(id, { text: 'Fier.', mood: 'proud' })).toEqual({
        ok: true,
        value: { watering: 'unchanged', note: 'created' },
      });
      expect(stored.rows.size).toBe(1);
      expect([...notes.rows.values()][0]).toMatchObject({ date: TODAY, text: 'Fier.' });
    });

    it('does not water when the note is refused', async () => {
      const { tracker, id, waterings: stored } = await withHabit();
      const result = await tracker.waterToday(id, { text: 'x'.repeat(5000), mood: null });
      expect(result).toEqual({ ok: false, error: 'NOTE_TOO_LONG' });
      expect(stored.rows.size).toBe(0);
    });

    it('shows notes, waterings and blooms in the habit detail', async () => {
      const { tracker, id } = await withHabit();
      await tracker.saveNote(id, day(-5), { text: 'Ancienne', mood: null });
      await tracker.saveNote(id, day(-1), { text: 'Récente', mood: 'easy' });
      await tracker.saveNote(id, day(-2), { text: 'Effacée', mood: null });
      await tracker.saveNote(id, day(-2), { text: '', mood: null });
      await tracker.waterToday(id);

      const detail = (await tracker.getHabit(id))!;
      expect(detail.notes.map((note) => note.text)).toEqual(['Récente', 'Ancienne']);
      expect(detail.todayNote).toBeNull();
      expect(detail.wateredToday).toBe(true);
      const byDate = Object.fromEntries(detail.days.map((entry) => [entry.date, entry]));
      expect(byDate[day(-1)]!.note?.text).toBe('Récente');
      expect(byDate[day(-2)]!.note).toBeNull();
      expect(byDate[TODAY]!.watered).toBe(true);
      expect(byDate[day(-1)]!.watered).toBe(false);
      // Today is day 10 of the plant: it blooms once.
      expect(
        detail.plant.pixels.filter((pixel) => pixel?.bloom).map((pixel) => pixel!.day),
      ).toEqual([10]);
    });

    it("gives today's note for the watering panel", async () => {
      const { tracker, id } = await withHabit();
      await tracker.waterToday(id, { text: 'Ce matin.', mood: 'craving' });
      expect((await tracker.getHabit(id))!.todayNote).toMatchObject({
        text: 'Ce matin.',
        mood: 'craving',
      });
    });
  });
});
