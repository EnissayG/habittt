import { createHabitTracker } from './habitTracker';
import { SPECIES_IDS } from './plant/registry';
import { MAX_GROWTH_DAYS } from './plant/grid';
import { renderPlant } from './plant/renderPlant';
import { relapseIdFor } from './relapse';
import { replantSeed } from './replanting';
import {
  InMemoryHabitRepository,
  InMemoryNoteRepository,
  InMemoryRelapseRepository,
  InMemoryReplantingRepository,
  InMemoryWateringRepository,
  NOW,
  TODAY,
  day,
  fixedClock,
} from './testSupport';

function setup(hour = 10) {
  const relapses = new InMemoryRelapseRepository();
  const notes = new InMemoryNoteRepository();
  const waterings = new InMemoryWateringRepository();
  const replantings = new InMemoryReplantingRepository();
  const habits = new InMemoryHabitRepository([relapses, notes, waterings, replantings]);
  let nextId = 0;
  const tracker = createHabitTracker({
    habits,
    relapses,
    notes,
    waterings,
    replantings,
    clock: fixedClock(undefined, undefined, hour),
    generateId: () => `habit-${++nextId}`,
    generateSeed: () => 7,
  });
  return { tracker, habits, relapses, notes, waterings, replantings };
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
    // The relapse ended the life: the plant is dead, no running counter.
    expect((await tracker.getHabit(habitId))?.stats.currentStreak).toBe(0);

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

  it('returns the plant of the current life, dead once a relapse ended it', async () => {
    const { tracker } = setup();
    const added = await tracker.addHabit({
      name: 'No smoking',
      startDate: day(-2),
      species: 'pothos',
    });
    if (!added.ok) throw new Error('setup failed');
    await tracker.toggleRelapse(added.value.id, day(-1)); // day 2 of the plant

    // It held day 1, and died on day 2: drawn as on its last day held.
    const detail = await tracker.getHabit(added.value.id);
    expect(detail?.plant).toEqual(
      renderPlant({
        species: 'pothos',
        seed: added.value.seed,
        elapsedDays: 1,
        relapseDays: [],
        dead: true,
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
      // Smoking: relapse yesterday, its plant is dead (0); Sugar: 3 days in a row.
      expect(shelf.totals).toEqual({ plants: 2, currentDays: 0 + 3 });
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

  describe('retiring and erasing', () => {
    it('takes a plant off the shelf to the garden, still readable, its growth stopped', async () => {
      const { tracker, id } = await withHabit(-9);
      expect(await tracker.retireHabit(id, 'garden')).toEqual({ ok: true, value: undefined });

      const shelf = await tracker.getShelf();
      expect(shelf.habits[id]).toBeUndefined();
      expect(shelf.totals.plants).toBe(0);
      expect(await tracker.listHabits()).toEqual([]);
      const detail = await tracker.getHabit(id);
      expect(detail?.habit.status).toBe('garden');
      expect(detail?.habit.retiredOn).toBe(TODAY);
    });

    it('computes a retired plant only up to the day it was retired', async () => {
      const { tracker, habits, id } = await withHabit(-9);
      const habit = habits.rows.get(id)!;
      await habits.save({ ...habit, status: 'garden', retiredOn: day(-3) });
      const detail = await tracker.getHabit(id);
      expect(detail?.stats.totalDays).toBe(7);
      expect(detail?.days).toHaveLength(7);
      expect(detail?.wateredToday).toBe(false);
    });

    it('refuses relapses, notes and watering on a retired plant', async () => {
      const { tracker, id } = await withHabit(-9);
      await tracker.retireHabit(id, 'given');
      const refused = { ok: false, error: 'HABIT_RETIRED' };
      expect(await tracker.recordRelapse(id, TODAY)).toEqual(refused);
      expect(await tracker.toggleRelapse(id, TODAY)).toEqual(refused);
      expect(await tracker.waterToday(id)).toEqual(refused);
      expect(await tracker.saveNote(id, TODAY, { text: 'x', mood: null })).toEqual(refused);
      expect(await tracker.retireHabit(id, 'garden')).toEqual(refused);
    });

    it('erases a habit for good: only a trace of it remains, nothing that belongs to it', async () => {
      const { tracker, habits, relapses, notes, waterings, id } = await withHabit(-9);
      await tracker.recordRelapse(id, day(-2));
      await tracker.waterToday(id, { text: 'Une note', mood: null });

      expect(await tracker.eraseHabit(id)).toEqual({ ok: true, value: undefined });
      expect(habits.rows.get(id)).toMatchObject({ id, name: '', deletedAt: expect.any(String) });
      expect(relapses.rows.size).toBe(0);
      expect(notes.rows.size).toBe(0);
      expect(waterings.rows.size).toBe(0);
      expect(await tracker.getHabit(id)).toBeUndefined();
      expect((await tracker.getShelf()).totals.plants).toBe(0);
    });

    it('erases a plant of the garden too, and leaves the other habits alone', async () => {
      const { tracker, relapses, id } = await withHabit(-9);
      const other = await tracker.addHabit({ name: 'Sucre', startDate: day(-5) });
      if (!other.ok) throw new Error('setup failed');
      await tracker.recordRelapse(other.value.id, day(-1));
      await tracker.retireHabit(id, 'garden');
      expect(await tracker.eraseHabit(id)).toEqual({ ok: true, value: undefined });
      expect(relapses.rows.size).toBe(1);
      expect((await tracker.getShelf()).totals.plants).toBe(1);
    });

    it('answers HABIT_NOT_FOUND for an unknown or erased habit', async () => {
      const { tracker, id } = await withHabit(-9);
      expect(await tracker.retireHabit('nope', 'garden')).toEqual({
        ok: false,
        error: 'HABIT_NOT_FOUND',
      });
      await tracker.eraseHabit(id);
      expect(await tracker.eraseHabit(id)).toEqual({ ok: false, error: 'HABIT_NOT_FOUND' });
      expect(await tracker.recordRelapse(id, TODAY)).toEqual({
        ok: false,
        error: 'HABIT_NOT_FOUND',
      });
    });
  });

  describe('lives: the plant dies, and is replanted', () => {
    it('kills the plant on a relapse: dead, no running counter, its days as a record', async () => {
      const { tracker, id } = await withHabit(-9);
      await tracker.recordRelapse(id, TODAY);
      const detail = (await tracker.getHabit(id))!;
      expect(detail.life).toMatchObject({ index: 0, dead: true, days: 9 });
      expect(detail.plant.dead).toBe(true);
      expect(detail.stats.currentStreak).toBe(0);
      expect(detail.stats.longestStreak).toBe(9);
      expect((await tracker.getShelf()).totals.currentDays).toBe(0);
    });

    it('draws the plant of the current life only, from its own seed and first day', async () => {
      const { tracker, id } = await withHabit(-9);
      await tracker.recordRelapse(id, day(-4));
      await tracker.replantHabit(id);
      const detail = (await tracker.getHabit(id))!;
      expect(detail.life).toMatchObject({ index: 1, start: TODAY, days: 0, dead: false });
      expect(detail.life.seed).toBe(replantSeed(id, TODAY));
      expect(detail.lives).toHaveLength(2);
      expect(detail.plant).toEqual(
        renderPlant({
          species: detail.habit.species,
          seed: replantSeed(id, TODAY),
          elapsedDays: 0,
          relapseDays: [],
          wateredDays: [],
        }),
      );
      // The journal still shows every day of the habit.
      expect(detail.days).toHaveLength(10);
    });

    it('refuses to replant a living plant, a retired one, or twice the same day', async () => {
      const { tracker, id } = await withHabit(-9);
      expect(await tracker.replantHabit(id)).toEqual({ ok: false, error: 'PLANT_ALIVE' });
      await tracker.recordRelapse(id, TODAY);
      expect(await tracker.replantHabit(id)).toEqual({ ok: true, value: undefined });
      expect(await tracker.replantHabit(id)).toEqual({ ok: false, error: 'PLANT_ALIVE' });
      await tracker.retireHabit(id, 'garden');
      expect(await tracker.replantHabit(id)).toEqual({ ok: false, error: 'HABIT_RETIRED' });
    });

    it('brings the plant back when its relapse is cancelled', async () => {
      const { tracker, id } = await withHabit(-9);
      await tracker.recordRelapse(id, day(-2));
      await tracker.replantHabit(id);
      await tracker.toggleRelapse(id, day(-2));
      const detail = (await tracker.getHabit(id))!;
      expect(detail.lives).toHaveLength(1);
      expect(detail.life).toMatchObject({ index: 0, dead: false, days: 10 });
      expect(detail.plant.dead).toBe(false);
    });

    it('waters a living plant only', async () => {
      const { tracker, id } = await withHabit(-9);
      await tracker.recordRelapse(id, TODAY);
      expect(await tracker.waterToday(id)).toEqual({ ok: false, error: 'PLANT_DEAD' });
    });

    it('blooms the days watered during the current life only', async () => {
      const { tracker, id, waterings } = await withHabit(-9);
      await tracker.waterToday(id);
      await tracker.recordRelapse(id, day(-3));
      await tracker.replantHabit(id);
      expect(waterings.rows.size).toBe(1);
      // Watered today, but the new plant was replanted today and has not grown yet.
      const detail = (await tracker.getHabit(id))!;
      expect(detail.plant.pixels.some((pixel) => pixel?.bloom)).toBe(false);
    });

    it('erases the replantings with the habit', async () => {
      const { tracker, id, replantings } = await withHabit(-9);
      await tracker.recordRelapse(id, TODAY);
      await tracker.replantHabit(id);
      await tracker.eraseHabit(id);
      expect(replantings.rows.size).toBe(0);
    });
  });

  describe('getHerbarium', () => {
    it('lists the past lives of each habit, newest first; a retired one ends on its day', async () => {
      const { tracker, id } = await withHabit(-9);
      await tracker.recordRelapse(id, day(-6));
      await tracker.replantHabit(id);
      const sugar = await tracker.addHabit({ name: 'Sucre', startDate: day(-4) });
      const given = await tracker.addHabit({ name: 'Écrans', startDate: day(-4) });
      if (!sugar.ok || !given.ok) throw new Error('setup failed');
      await tracker.retireHabit(sugar.value.id, 'garden');
      await tracker.recordRelapse(given.value.id, day(-1));
      await tracker.retireHabit(given.value.id, 'given');

      const herbarium = await tracker.getHerbarium();
      expect(herbarium.map((entry) => entry.habit.name)).toEqual(['Fumer', 'Sucre']);
      expect(herbarium[0]!.lives).toEqual([
        { index: 0, start: day(-9), end: day(-6), days: 3, endedBy: 'relapse' },
      ]);
      expect(herbarium[1]!.lives).toEqual([
        { index: 0, start: day(-4), end: TODAY, days: 5, endedBy: 'retired' },
      ]);
      expect(await tracker.herbariumCount()).toBe(2);
    });

    it('leaves out habits without a past life', async () => {
      const { tracker } = await withHabit(-9);
      expect(await tracker.getHerbarium()).toEqual([]);
    });
  });

  describe('renameHabit and exportData', () => {
    it('renames a habit of the shelf, and refuses a bad name or a retired habit', async () => {
      const { tracker, id } = await withHabit(-9);
      expect(await tracker.renameHabit(id, '  Ne plus fumer ')).toEqual({
        ok: true,
        value: undefined,
      });
      expect((await tracker.getHabit(id))?.habit.name).toBe('Ne plus fumer');
      expect(await tracker.renameHabit(id, ' ')).toEqual({ ok: false, error: 'NAME_EMPTY' });
      await tracker.retireHabit(id, 'garden');
      expect(await tracker.renameHabit(id, 'Autre')).toEqual({
        ok: false,
        error: 'HABIT_RETIRED',
      });
    });

    it('exports every habit kept, with its rows and lives', async () => {
      const { tracker, id } = await withHabit(-9);
      await tracker.recordRelapse(id, day(-2));
      await tracker.replantHabit(id);
      await tracker.saveNote(id, day(-2), { text: 'Dur', mood: null });
      const other = await tracker.addHabit({ name: 'Sucre', startDate: day(-1) });
      if (!other.ok) throw new Error('setup failed');
      await tracker.eraseHabit(other.value.id);

      const data = await tracker.exportData();
      expect(data.exportedAt).toBe(NOW);
      expect(data.habits).toHaveLength(1);
      expect(data.habits[0]).toMatchObject({
        name: 'Fumer',
        relapses: [day(-2)],
        replantings: [TODAY],
        notes: [{ date: day(-2), text: 'Dur', mood: null }],
        lives: [
          { start: day(-9), end: day(-2), days: 7 },
          { start: TODAY, end: null, days: 0 },
        ],
      });
    });
  });
});
