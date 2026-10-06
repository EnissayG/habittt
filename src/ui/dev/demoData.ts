import { addDays, type HabitTracker, type SpeciesId } from '../../domain';

// Demo habits for testing the shelf on a phone (development only): ages
// from 3 to 400 days, relapses, every kind of plant, four hanging ones, and
// enough standing plants for three walls.

interface DemoHabit {
  name: string;
  species: SpeciesId;
  /** Days of the habit, today included. */
  age: number;
  /** Relapses, in days before today. */
  relapses: readonly number[];
}

export const DEMO_HABITS: readonly DemoHabit[] = [
  { name: 'Fumer', species: 'bonsai', age: 400, relapses: [380, 301, 122] },
  { name: 'Soda', species: 'pothos', age: 120, relapses: [90] },
  { name: 'Sucre', species: 'monstera', age: 45, relapses: [30, 12] },
  { name: 'Écrans au lit', species: 'cactus', age: 120, relapses: [] },
  { name: 'Alcool', species: 'sansevieria', age: 400, relapses: [200] },
  { name: 'Ongles', species: 'calathea', age: 3, relapses: [] },
  { name: 'Réseaux', species: 'pearls', age: 45, relapses: [2] },
  { name: 'Grignoter', species: 'fern', age: 120, relapses: [60, 59, 20] },
  { name: 'Café', species: 'ficus', age: 45, relapses: [] },
  { name: 'Jeux vidéo', species: 'bamboo', age: 400, relapses: [10] },
  { name: 'Achats', species: 'jade', age: 120, relapses: [100] },
  { name: 'Râler', species: 'spider', age: 3, relapses: [1] },
  { name: 'Séries', species: 'pothos', age: 400, relapses: [] },
  { name: 'Procrastiner', species: 'aloe', age: 45, relapses: [44, 5] },
  { name: 'Vapoter', species: 'pearls', age: 120, relapses: [] },
  { name: 'Fast-food', species: 'cactus', age: 3, relapses: [] },
  { name: 'Se ronger', species: 'monstera', age: 400, relapses: [399, 250] },
];

/** Fixed seeds, so the demo plants are the same every time. */
export function demoSeeds(): () => number {
  let state = 0x9e3779b9;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

/** Fills an empty database with the demo habits, through the use cases. */
export async function seedDemo(tracker: HabitTracker): Promise<void> {
  const today = tracker.today();
  for (const demo of DEMO_HABITS) {
    const result = await tracker.addHabit({
      name: demo.name,
      startDate: addDays(today, -(demo.age - 1)),
      species: demo.species,
    });
    if (!result.ok) throw new Error(`Demo habit refused: ${demo.name} (${result.error})`);
    for (const daysAgo of demo.relapses) {
      await tracker.recordRelapse(result.value.id, addDays(today, -daysAgo));
    }
  }
}
