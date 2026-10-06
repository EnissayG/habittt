import {
  createHabitTracker,
  PLANT_GRID,
  WINDOW_SIZE,
  type LocalDate,
  type SpeciesId,
} from '../../domain';
import {
  fixedClock,
  InMemoryHabitRepository,
  InMemoryRelapseRepository,
} from '../../domain/testSupport';
import { buildShelfRows, filledRows } from './shelfRows';

async function shelfWith(plants: [SpeciesId, number][]) {
  let next = 0;
  const tracker = createHabitTracker({
    habits: new InMemoryHabitRepository(),
    relapses: new InMemoryRelapseRepository(),
    clock: fixedClock(),
    generateId: () => `h${++next}`,
    generateSeed: () => 7,
  });
  for (const [species, startedDaysAgo] of plants) {
    const start = new Date(Date.UTC(2026, 9, 3 - startedDaysAgo)).toISOString().slice(0, 10);
    await tracker.addHabit({ name: species, startDate: start as LocalDate, species });
  }
  return tracker.getShelf();
}

describe('buildShelfRows', () => {
  it('shows the window row and the new-habit slot when there is no habit', async () => {
    const rows = buildShelfRows(await shelfWith([]));
    expect(rows.map((row) => row.kind)).toEqual(['window', 'shelf']);
    expect(rows[0]!.slots).toEqual([]);
    expect(rows[1]!.slots.map((slot) => slot.kind)).toEqual(['new', 'empty', 'empty']);
  });

  it('puts the second hanging plant on the next wall', async () => {
    const rows = buildShelfRows(
      await shelfWith([
        ['pothos', 30],
        ['pearls', 30],
        ['cactus', 30],
      ]),
    );
    expect(rows.map((row) => row.kind)).toEqual(['window', 'shelf', 'hanging']);
    expect(rows[1]!.slots.map((slot) => slot.kind)).toEqual(['plant', 'new', 'empty']);
    expect(rows[2]!.slots.map((slot) => slot.kind)).toEqual(['plant', 'empty', 'empty']);
  });

  it('makes the window row at least as tall as the window', async () => {
    const [top] = buildShelfRows(await shelfWith([['cactus', 1]]));
    expect(top!.rows.to - top!.rows.from).toBeGreaterThanOrEqual(WINDOW_SIZE.height);
  });

  it('shows hanging plants from the top and standing plants down to the shelf', async () => {
    const rows = buildShelfRows(
      await shelfWith([
        ['pothos', 60],
        ['pearls', 60],
        ['monstera', 90],
      ]),
    );
    const hanging = rows.find((row) => row.kind === 'hanging')!;
    const shelf = rows.find((row) => row.kind === 'shelf')!;
    expect(hanging.rows.from).toBe(0);
    expect(shelf.rows.to).toBe(PLANT_GRID.height);
  });

  it('never cuts a plant: the band covers every slot of the row', async () => {
    const rows = buildShelfRows(
      await shelfWith([
        ['bonsai', 120],
        ['monstera', 120],
        ['aloe', 5],
        ['fern', 120],
      ]),
    );
    for (const row of rows) {
      for (const slot of row.slots) {
        const { top, bottom } =
          slot.kind === 'plant' ? filledRows(slot.image) : filledRows(slot.art);
        if (top > bottom) continue;
        expect(row.rows.from).toBeLessThanOrEqual(top);
        expect(row.rows.to).toBeGreaterThan(bottom);
      }
    }
  });

  it('keeps a shelf of young plants low', async () => {
    const young = buildShelfRows(
      await shelfWith([
        ['cactus', 1],
        ['cactus', 1],
      ]),
    );
    const old = buildShelfRows(
      await shelfWith([
        ['cactus', 1],
        ['cactus', 119],
      ]),
    );
    const height = (rows: typeof young) => {
      const shelf = rows.find((row) => row.kind === 'shelf')!;
      return shelf.rows.to - shelf.rows.from;
    };
    expect(height(young)).toBeLessThan(height(old));
  });
});
