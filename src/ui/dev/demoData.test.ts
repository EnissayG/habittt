import { createHabitTracker, resolveSpecies } from '../../domain';
import {
  fixedClock,
  InMemoryHabitRepository,
  InMemoryNoteRepository,
  InMemoryRelapseRepository,
  InMemoryWateringRepository,
} from '../../domain/testSupport';
import { DEMO_HABITS, demoSeeds, seedDemo } from './demoData';

async function demoShelf() {
  let next = 0;
  const tracker = createHabitTracker({
    habits: new InMemoryHabitRepository(),
    relapses: new InMemoryRelapseRepository(),
    notes: new InMemoryNoteRepository(),
    waterings: new InMemoryWateringRepository(),
    clock: fixedClock(),
    generateId: () => `demo-${++next}`,
    generateSeed: demoSeeds(),
  });
  await seedDemo(tracker);
  return tracker.getShelf();
}

describe('demo data', () => {
  it('fills about fifteen habits of varied ages, with relapses', async () => {
    const shelf = await demoShelf();
    const summaries = Object.values(shelf.habits);
    expect(summaries.length).toBeGreaterThanOrEqual(15);
    const ages = new Set(summaries.map((s) => s.stats.totalDays));
    for (const age of [3, 45, 120, 400]) expect(ages.has(age)).toBe(true);
    expect(summaries.filter((s) => s.stats.cleanDays < s.stats.totalDays).length).toBeGreaterThan(
      5,
    );
  });

  it('has at least three hanging plants, several species and three walls', async () => {
    const shelf = await demoShelf();
    const species = DEMO_HABITS.map((h) => h.species);
    expect(
      species.filter((id) => resolveSpecies(id).species.hanging).length,
    ).toBeGreaterThanOrEqual(3);
    expect(new Set(species).size).toBeGreaterThanOrEqual(10);
    expect(shelf.layout.walls).toHaveLength(3);
  });

  it('has a few notes and plants watered today', async () => {
    const shelf = await demoShelf();
    // Sugar is 45 days old: watered today, its plant blooms (past 120 days nothing grows).
    const sugar = Object.values(shelf.habits).find((s) => s.habit.name === 'Sucre')!;
    expect(sugar.plant.pixels.some((pixel) => pixel?.bloom)).toBe(true);
  });

  it('draws the same plants every time', async () => {
    const [a, b] = await Promise.all([demoShelf(), demoShelf()]);
    expect(Object.values(a.habits).map((s) => s.habit.seed)).toEqual(
      Object.values(b.habits).map((s) => s.habit.seed),
    );
  });
});
