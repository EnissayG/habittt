import { MAX_GROWTH_DAYS, renderPlant, SPECIES_IDS } from '../../domain';
import { plantColor } from '../theme/plantPalette';
import { FOLIAGE_LABELS, isRare, potLabel, TRAIT_LABELS, varietyLabel } from './labels';

// Parity with the reference prototype (docs/prototypes/plants.js): for every
// species, several seeds, ages and relapse sets, the app must draw exactly
// the same plant: same color (through the UI palette) and same day on every
// pixel. Runs the prototype file as is.

interface PrototypeRender {
  w: number;
  h: number;
  grid: (string | null)[];
  dayAt: number[];
  traits: { variety: string; pot: string; foliage: string; trait: string; rare: boolean };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const prototype = require('../../../docs/prototypes/plants.js') as {
  SPECIES: Record<string, unknown>;
  render(key: string, seed: number, days: number, relapses: number[]): PrototypeRender;
};

const SEEDS = [0, 1, 3, 12, 42, 100, 174, 2026, 123456789, 4294967295];

/**
 * Fixed seeds may miss a rare variety or trait. These extra seeds were found
 * by scanning seeds 0-2999 with the prototype for the first one showing each
 * variety, trait and pot shape not yet covered. The coverage test below
 * checks that nothing is missing.
 */
const EXTRA_SEEDS: Record<string, number[]> = {
  sansevieria: [2, 128, 141],
  pothos: [15],
  monstera: [5, 94],
  spider: [8, 68],
  cactus: [11, 37],
  aloe: [2, 8, 75],
  fern: [11, 85],
  ficus: [38, 107],
  bamboo: [6, 227],
  pearls: [4, 7, 44],
  calathea: [4, 242],
  jade: [13, 276],
  bonsai: [2, 8, 9, 19, 22, 38],
};

const VARIETY_COUNT: Record<string, number> = {
  sansevieria: 4,
  pothos: 2,
  monstera: 2,
  spider: 3,
  cactus: 3,
  aloe: 1,
  fern: 3,
  ficus: 4,
  bamboo: 6,
  pearls: 3,
  calathea: 3,
  jade: 1,
  bonsai: 4,
};

const seedsFor = (species: string) => [...SEEDS, ...(EXTRA_SEEDS[species] ?? [])];

const AGES = [1, 30, 87, MAX_GROWTH_DAYS];
const RELAPSE_SETS = [[], [2, 30, 31, 87]];

interface Gap {
  seed: number;
  days: number;
  x: number;
  y: number;
  prototype: string;
  app: string;
}

function compare(species: string): Gap[] {
  const gaps: Gap[] = [];
  for (const seed of seedsFor(species)) {
    for (const days of AGES) {
      for (const relapses of RELAPSE_SETS) {
        const reference = prototype.render(species, seed, days, relapses);
        const image = renderPlant({ species, seed, elapsedDays: days, relapseDays: relapses });
        image.pixels.forEach((pixel, i) => {
          const expected = `${reference.grid[i]?.toUpperCase() ?? 'empty'}@${reference.dayAt[i]}`;
          const actual = pixel
            ? `${plantColor(pixel, image.genome).toUpperCase()}@${pixel.day}`
            : 'empty@0';
          if (expected !== actual) {
            const x = i % image.width;
            const y = Math.floor(i / image.width);
            gaps.push({ seed, days, x, y, prototype: expected, app: actual });
          }
        });
      }
    }
  }
  return gaps;
}

describe('parity with the prototype', () => {
  it('knows the same species', () => {
    expect([...SPECIES_IDS].sort()).toEqual(Object.keys(prototype.SPECIES).sort());
  });

  it.each(SPECIES_IDS)('%s has the same French traits as the prototype', (species) => {
    for (let seed = 0; seed < 100; seed++) {
      const reference = prototype.render(species, seed, 1, []).traits;
      const image = renderPlant({ species, seed, elapsedDays: 1, relapseDays: [] });
      expect({
        seed,
        variety: varietyLabel(image.variety),
        pot: potLabel(image.genome),
        foliage: FOLIAGE_LABELS[image.genome.foliage],
        trait: TRAIT_LABELS[image.genome.trait],
        rare: isRare(image),
      }).toEqual({ seed, ...reference });
    }
  });

  it.each(SPECIES_IDS)('%s: the seeds cover every variety, trait and pot shape', (species) => {
    const traits = seedsFor(species).map((seed) => prototype.render(species, seed, 1, []).traits);
    expect(new Set(traits.map((t) => t.variety)).size).toBe(VARIETY_COUNT[species]);
    expect(new Set(traits.map((t) => t.trait))).toEqual(new Set(['', 'panaché', 'rosé', 'doré']));
    // "pot évasé bleu" -> "évasé"; a bonsai always sits on a "plateau …".
    const shapes = new Set(
      traits.map((t) => (t.pot.startsWith('plateau') ? 'plateau' : t.pot.split(' ')[1])),
    );
    expect(shapes).toEqual(
      new Set(species === 'bonsai' ? ['plateau'] : ['évasé', 'droit', 'rond']),
    );
  });

  it.each(SPECIES_IDS)('%s is drawn exactly like the prototype', (species) => {
    const gaps = compare(species);
    // Show a few gaps when it fails; the count tells the extent.
    expect({ count: gaps.length, first: gaps.slice(0, 5) }).toEqual({ count: 0, first: [] });
  });
});
