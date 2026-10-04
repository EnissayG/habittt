import {
  renderPlant,
  SPECIES_IDS,
  type Genome,
  type PlantImage,
  type PlantPixel,
} from '../../domain';
import { NEUTRAL_VITALITY, plantColor } from '../theme/plantPalette';
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
