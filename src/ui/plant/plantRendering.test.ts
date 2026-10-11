import {
  renderPlant,
  SPECIES_IDS,
  type Genome,
  type PlantImage,
  type PlantPixel,
} from '../../domain';
import { BLOOM, NEUTRAL_VITALITY, plantColor } from '../theme/plantPalette';
import { buildColorRuns } from './colorRuns';
import { pixelScale } from './pixelScale';

const leaf = (relapse: boolean): PlantPixel => ({ tone: 'leaf', day: 3, relapse });
const genome: Genome = {
  potColor: 'terracotta',
  potShape: 'flared',
  potPattern: 'plain',
  mirrored: false,
  foliage: 'classic',
  trait: 'none',
  salt: 0,
};

describe('plantColor', () => {
  it('gives a yellowed color on a relapse day, same tone otherwise', () => {
    expect(plantColor(leaf(true), genome)).not.toBe(plantColor(leaf(false), genome));
  });

  it('colors the flower of a watered day, even on a relapse day', () => {
    const bloom: PlantPixel = { ...leaf(true), bloom: true };
    expect(plantColor(bloom, genome)).toBe(BLOOM);
    expect(plantColor(leaf(false), genome)).not.toBe(BLOOM);
  });

  it('dries a dead plant: its own color for every shade, the same whatever the foliage', () => {
    const dry: PlantPixel = { ...leaf(false), dry: true };
    expect(plantColor(dry, genome)).not.toBe(plantColor(leaf(false), genome));
    expect(plantColor(dry, genome)).toBe(plantColor(dry, { ...genome, foliage: 'bluish' }));
    expect(plantColor({ ...dry, relapse: true }, genome)).toBe(plantColor(dry, genome));
    const shades = (['leafLight', 'leaf', 'leafDark', 'leafDeep'] as const).map((tone) =>
      plantColor({ ...dry, tone }, genome),
    );
    expect(new Set(shades).size).toBe(4);
  });

  it('dries the soil of a dead plant, and leaves its pot as it was', () => {
    const soil: PlantPixel = { tone: 'soil', day: 0, relapse: false };
    expect(plantColor({ ...soil, dry: true }, genome)).not.toBe(plantColor(soil, genome));
    const pot: PlantPixel = { tone: 'pot', day: 0, relapse: false };
    expect(plantColor({ ...pot, dry: true }, genome)).toBe(plantColor(pot, genome));
  });

  it('never draws a dead plant in red', () => {
    for (const species of SPECIES_IDS) {
      const image = renderPlant({
        species,
        seed: 7,
        elapsedDays: 120,
        relapseDays: [5, 60],
        wateredDays: [3],
        dead: true,
      });
      for (const pixel of image.pixels) {
        if (!pixel?.dry) continue;
        const color = plantColor(pixel, image.genome);
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
        // Straw and dead wood: warm, and never far from grey.
        expect(r! - b!).toBeGreaterThan(0);
        expect(r! - g!).toBeLessThan(48);
      }
    }
  });

  it('colors the pot by pot color and the leaves by foliage hue', () => {
    const pot: PlantPixel = { tone: 'pot', day: 0, relapse: false };
    expect(plantColor(pot, genome)).not.toBe(plantColor(pot, { ...genome, potColor: 'blue' }));
    expect(plantColor(leaf(false), genome)).not.toBe(
      plantColor(leaf(false), { ...genome, foliage: 'forest' }),
    );
  });

  it('has a color for every tone the generator can produce', () => {
    for (const species of SPECIES_IDS) {
      const image = renderPlant({ species, seed: 7, elapsedDays: 120, relapseDays: [5, 60] });
      for (const pixel of image.pixels) {
        if (pixel) expect(plantColor(pixel, image.genome)).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it('ignores vitality for now (planned for the next step)', () => {
    const tired = { thirst: 1, fatigue: 1 };
    expect(plantColor(leaf(false), genome, tired)).toBe(
      plantColor(leaf(false), genome, NEUTRAL_VITALITY),
    );
  });
});

describe('buildColorRuns', () => {
  const pixel = (tone: 'leaf' | 'bark'): PlantPixel => ({ tone, day: 1, relapse: false });
  const image: PlantImage = {
    width: 4,
    height: 2,
    genome,
    species: 'monstera',
    variety: null,
    fallback: false,
    dead: false,
    // row 0: leaf leaf . bark   row 1: . bark bark bark
    pixels: [
      pixel('leaf'),
      pixel('leaf'),
      null,
      pixel('bark'),
      null,
      ...Array(3).fill(pixel('bark')),
    ],
  };

  it('merges horizontal neighbours of the same color into one rectangle', () => {
    expect(buildColorRuns(image, (p) => p.tone)).toEqual([
      { color: 'leaf', path: 'M0 0h2v1h-2Z' },
      { color: 'bark', path: 'M3 0h1v1h-1ZM1 1h3v1h-3Z' },
    ]);
  });

  it('draws only a band of rows, moved to the top', () => {
    expect(buildColorRuns(image, (p) => p.tone, { from: 1, to: 2 })).toEqual([
      { color: 'bark', path: 'M1 0h3v1h-3Z' },
    ]);
  });

  it('leaves out pixels whose color is null', () => {
    expect(buildColorRuns(image, (p) => (p.tone === 'leaf' ? null : p.tone))).toEqual([
      { color: 'bark', path: 'M3 0h1v1h-1ZM1 1h3v1h-3Z' },
    ]);
  });

  it('draws nothing for an empty image', () => {
    expect(buildColorRuns({ ...image, pixels: Array(8).fill(null) }, () => 'x')).toEqual([]);
  });
});

describe('pixelScale', () => {
  const grid = { width: 48, height: 64 };

  it('uses a whole number of device pixels per plant pixel', () => {
    // 300 points at 2.625 device pixels per point = 787.5 px; 787.5 / 48 = 16.4 -> 16.
    const scale = pixelScale(grid, { width: 300, height: 1000 }, 2.625);
    expect(scale.devicePixelsPerCell).toBe(16);
    expect(scale.cellSize * 2.625).toBeCloseTo(16);
    expect(scale.width).toBeLessThanOrEqual(300);
  });

  it('is limited by the tighter dimension', () => {
    const scale = pixelScale(grid, { width: 1000, height: 128 }, 1);
    expect(scale.devicePixelsPerCell).toBe(2);
  });

  it('never goes below one device pixel', () => {
    expect(pixelScale(grid, { width: 10, height: 10 }, 1).devicePixelsPerCell).toBe(1);
  });
});
