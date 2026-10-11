import { potHalfWidths } from './genome';
import { PLANT_GRID, type PlantImage, type PlantPixel } from './grid';
import { renderPlant, rimRow, shelfRowsUnderPot } from './renderPlant';
import { SPECIES_IDS, SPECIES_REGISTRY } from './registry';

const SEEDS = [1, 7, 42, 174];
const SCENERY = new Set(['soil', 'pot', 'potShade', 'potPattern', 'potPatternShade']);
const SHELF = new Set(['shelf', 'shelfShade']);
const WOOD = new Set(['bark', 'barkDark', 'spine']);

const pair = (species: string, seed: number, elapsedDays = 120) => {
  const params = { species, seed, elapsedDays, relapseDays: [5], wateredDays: [3, 40] };
  return { alive: renderPlant(params), dead: renderPlant({ ...params, dead: true }) };
};

const isPlant = (pixel: PlantPixel | null | undefined): boolean =>
  !!pixel && !SCENERY.has(pixel.tone) && !SHELF.has(pixel.tone);

const at = (image: PlantImage, x: number, y: number) =>
  x < 0 || y < 0 || x >= image.width || y >= image.height
    ? null
    : (image.pixels[y * image.width + x] ?? null);

/** The row where fallen leaves lie: just above the board. */
const litterRow = (hanging: boolean) => shelfRowsUnderPot(hanging)[0] - 1;

const cases = SPECIES_IDS.flatMap((id) =>
  SEEDS.map((seed) => [id, seed, SPECIES_REGISTRY[id].hanging] as const),
);

describe('a dead plant, dried', () => {
  it.each(cases)('%s %i: keeps its pot and its shelf, pixel for pixel', (species, seed) => {
    const { alive, dead } = pair(species, seed);
    alive.pixels.forEach((pixel, i) => {
      if (!pixel || isPlant(pixel) || pixel.tone === 'soil') return;
      expect(dead.pixels[i]).toEqual(pixel);
    });
  });

  it.each(cases)('%s %i: flags every pixel of the plant, and its soil, as dry', (species, seed) => {
    const { dead } = pair(species, seed);
    for (const pixel of dead.pixels) {
      if (!pixel) continue;
      expect(pixel.dry === true).toBe(isPlant(pixel) || pixel.tone === 'soil');
      if (pixel.dry) expect(pixel.bloom).toBeUndefined();
    }
  });

  it.each(cases)(
    '%s %i: grows nothing, but for a few leaves on the shelf',
    (species, seed, hanging) => {
      const { alive, dead } = pair(species, seed);
      const added: number[] = [];
      dead.pixels.forEach((pixel, i) => {
        if (!pixel) return;
        const before = alive.pixels[i];
        if (before) {
          expect(pixel.tone).toBe(before.tone);
          expect(pixel.day).toBe(before.day);
        } else added.push(i);
      });
      expect(added.length).toBeLessThanOrEqual(5);
      for (const i of added) {
        const x = i % dead.width;
        const y = Math.floor(i / dead.width);
        expect(y).toBe(litterRow(hanging));
        expect(at(dead, x, y + 1)?.tone).toBe('shelf');
        expect(isPlant(dead.pixels[i])).toBe(true);
      }
    },
  );

  it.each(cases)('%s %i: loses part of its foliage, never its wood', (species, seed) => {
    const { alive, dead } = pair(species, seed);
    const count = (image: PlantImage, keep: (pixel: PlantPixel) => boolean) =>
      image.pixels.filter((pixel, i) => pixel && isPlant(pixel) && alive.pixels[i] && keep(pixel))
        .length;
    const foliage = (pixel: PlantPixel) => !WOOD.has(pixel.tone);
    expect(count(dead, (pixel) => WOOD.has(pixel.tone))).toBe(
      count(alive, (pixel) => WOOD.has(pixel.tone)),
    );
    expect(count(dead, foliage)).toBeLessThanOrEqual(count(alive, foliage));
    // It stays recognizable: most of it is still there.
    expect(count(dead, foliage)).toBeGreaterThanOrEqual(count(alive, foliage) * 0.6);
  });

  it.each(cases)('%s %i: only its outline falls, and never a thin line', (species, seed) => {
    const { alive, dead } = pair(species, seed);
    alive.pixels.forEach((pixel, i) => {
      if (!isPlant(pixel) || dead.pixels[i]) return;
      const x = i % alive.width;
      const y = Math.floor(i / alive.width);
      const sides = [
        at(alive, x - 1, y),
        at(alive, x + 1, y),
        at(alive, x, y - 1),
        at(alive, x, y + 1),
      ];
      expect(sides.some((side) => side === null)).toBe(true);
      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && isPlant(at(alive, x + dx, y + dy))) neighbours++;
        }
      }
      expect(neighbours).toBeGreaterThanOrEqual(4);
    });
  });

  it('makes the foliage of a grown leafy plant visibly ragged', () => {
    const { alive, dead } = pair('monstera', 42);
    const lost = alive.pixels.filter((pixel, i) => isPlant(pixel) && !dead.pixels[i]).length;
    expect(lost).toBeGreaterThan(30);
  });

  it('is the same on every day and every phone: nothing but the seed decides', () => {
    expect(pair('ficus', 42).dead).toEqual(pair('ficus', 42).dead);
    expect(pair('ficus', 42).dead.pixels).not.toEqual(pair('ficus', 43).dead.pixels);
  });

  it('leaves an empty pot as it is, but for its dry soil: nothing grew, nothing fell', () => {
    const { alive, dead } = pair('fern', 7, 0);
    dead.pixels.forEach((pixel, i) => {
      const before = alive.pixels[i] ?? null;
      if (before?.tone === 'soil') expect(pixel).toEqual({ ...before, dry: true });
      else expect(pixel).toEqual(before);
    });
  });

  it('lays the fallen leaves beside the pot, not under it', () => {
    for (const [species, seed, hanging] of cases) {
      const { alive, dead } = pair(species, seed);
      const anchor = Math.floor(PLANT_GRID.width / 2);
      const half = Math.max(...potHalfWidths(dead.genome.potShape));
      dead.pixels.forEach((pixel, i) => {
        if (!pixel || alive.pixels[i]) return;
        expect(Math.floor(i / dead.width)).toBeGreaterThan(rimRow(hanging));
        expect(Math.abs((i % dead.width) - anchor)).toBeGreaterThan(half);
      });
    }
  });
});
