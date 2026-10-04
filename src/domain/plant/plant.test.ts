import { MAX_GROWTH_DAYS, type PlantImage, type PlantPixel, type Tone } from './grid';
import { FALLBACK_SPECIES_ID, SPECIES_IDS, SPECIES_REGISTRY } from './registry';
import { planPlant, renderPlant } from './renderPlant';

const SEEDS = [0, 1, 42, 2026, 123456789, 4294967295];
const RELAPSES = [3, 4, 17, 50, 51, 52, 99, 120];

function render(species: string, seed: number, elapsedDays: number, relapseDays: number[] = []) {
  return renderPlant({ species, seed, elapsedDays, relapseDays });
}

function samePixel(a: PlantPixel | null, b: PlantPixel | null): boolean {
  if (a === null || b === null) return a === b;
  return a.tone === b.tone && a.day === b.day && a.relapse === b.relapse;
}

const TONE_CHAR: Record<Tone, string> = {
  leafDark: 'D',
  leaf: 'M',
  leafLight: 'L',
  leafDeep: 'K',
  leafAccent: 'P',
  bark: 'B',
  soil: '=',
  pot: 'o',
  potShade: 'O',
  shelf: '-',
  shelfShade: '_',
};

function toAscii(image: PlantImage): string {
  const rows: string[] = [];
  for (let y = 0; y < image.height; y++) {
    let row = '';
    for (let x = 0; x < image.width; x++) {
      const pixel = image.pixels[y * image.width + x];
      row += pixel ? TONE_CHAR[pixel.tone] : '.';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

describe('species registry', () => {
  it.each(SPECIES_IDS)('%s is registered under its own id', (id) => {
    expect(SPECIES_REGISTRY[id].id).toBe(id);
  });
});

describe.each(SPECIES_IDS)('plant generator: %s', (species) => {
  it('1. is deterministic', () => {
    for (const seed of SEEDS) {
      for (const days of [1, 37, MAX_GROWTH_DAYS]) {
        expect(render(species, seed, days, RELAPSES)).toEqual(
          render(species, seed, days, RELAPSES),
        );
      }
    }
  });

  // Property 2 (append-only growth), checked day by day. Between day N-1 and
  // day N, every cell must be identical or hold a pixel of day N. By
  // induction, for any A < B, a cell either kept its day-A pixel or was
  // painted by a day in (A, B]: what has grown never moves, disappears or
  // changes, unless a later day paints over it.
  it('2. only ever adds pixels of the new day', () => {
    for (const seed of SEEDS) {
      for (const relapses of [[], RELAPSES]) {
        let previous = render(species, seed, 0, relapses);
        for (let day = 1; day <= MAX_GROWTH_DAYS; day++) {
          const current = render(species, seed, day, relapses);
          const changedCells = current.pixels
            .map((pixel, index) => ({ pixel, index }))
            .filter(({ pixel, index }) => !samePixel(previous.pixels[index] ?? null, pixel));
          const foreign = changedCells.filter(({ pixel }) => pixel?.day !== day);
          expect({ seed, day, foreign }).toEqual({ seed, day, foreign: [] });
          previous = current;
        }
      }
    }
  });

  it('3. a relapse changes only the relapse flag of its own day', () => {
    for (const seed of SEEDS) {
      for (const days of [60, MAX_GROWTH_DAYS]) {
        const clean = render(species, seed, days);
        const marked = render(species, seed, days, RELAPSES);
        clean.pixels.forEach((pixel, index) => {
          const other = marked.pixels[index] ?? null;
          expect(other?.tone).toBe(pixel?.tone);
          expect(other?.day).toBe(pixel?.day);
          expect(pixel?.relapse ?? false).toBe(false);
          if (pixel && other) expect(other.relapse).toBe(RELAPSES.includes(pixel.day));
        });
      }
    }
  });

  it('4. every day from 1 to 120 adds at least one visible pixel', () => {
    for (const seed of SEEDS) {
      const silentDays: number[] = [];
      for (let day = 1; day <= MAX_GROWTH_DAYS; day++) {
        const image = render(species, seed, day);
        if (!image.pixels.some((pixel) => pixel?.day === day)) silentDays.push(day);
      }
      expect({ seed, silentDays }).toEqual({ seed, silentDays: [] });
    }
  });

  it('5. different seeds give different plants', () => {
    const plants = SEEDS.map((seed) => toAscii(render(species, seed, MAX_GROWTH_DAYS)));
    expect(new Set(plants).size).toBe(SEEDS.length);
  });

  it('6. never plans a pixel outside the grid', () => {
    for (const seed of SEEDS) {
      const { plan } = planPlant(species, seed);
      const image = render(species, seed, 0);
      const outside = plan
        .flatMap((strokes, index) => strokes.map((stroke) => ({ ...stroke, day: index + 1 })))
        .filter(({ x, y }) => x < 0 || y < 0 || x >= image.width || y >= image.height);
      expect({ seed, outside }).toEqual({ seed, outside: [] });
    }
  });

  it('7. stops growing after 120 days', () => {
    for (const seed of SEEDS) {
      const last = render(species, seed, MAX_GROWTH_DAYS, RELAPSES);
      expect(render(species, seed, MAX_GROWTH_DAYS + 1, RELAPSES)).toEqual(last);
      expect(render(species, seed, 500, RELAPSES)).toEqual(last);
    }
  });

  it('8. every day keeps at least one visible pixel at day 120', () => {
    for (const seed of SEEDS) {
      for (const relapses of [[], RELAPSES]) {
        const image = render(species, seed, MAX_GROWTH_DAYS, relapses);
        const visibleDays = new Set(image.pixels.map((pixel) => pixel?.day ?? 0));
        const hiddenDays: number[] = [];
        for (let day = 1; day <= MAX_GROWTH_DAYS; day++) {
          if (!visibleDays.has(day)) hiddenDays.push(day);
        }
        expect({ seed, hiddenDays }).toEqual({ seed, hiddenDays: [] });
      }
    }
  });

  it('draws only the pot and shelf before the first day', () => {
    const image = render(species, 42, 0);
    expect(image.pixels.every((pixel) => pixel === null || pixel.day === 0)).toBe(true);
    expect(image.pixels.some((pixel) => pixel !== null)).toBe(true);
    expect(render(species, 42, -5)).toEqual(image);
  });

  // Frozen reference: fails on purpose if the drawing changes. The four
  // species will be redrawn before release; update with `npx jest -u` then.
  it('matches its frozen reference at day 120', () => {
    expect(toAscii(render(species, 42, MAX_GROWTH_DAYS))).toMatchSnapshot();
  });
});

describe('unknown species', () => {
  it('falls back without throwing, and says so', () => {
    const image = render('orchid-from-the-future', 42, 30);
    expect(image.fallback).toBe(true);
    expect(image.species).toBe(FALLBACK_SPECIES_ID);
    expect(image.pixels).toEqual(render(FALLBACK_SPECIES_ID, 42, 30).pixels);
  });

  it('is not flagged for a known species', () => {
    expect(render('pothos', 42, 30).fallback).toBe(false);
  });
});

describe('render output', () => {
  it('has width * height pixels and a pot style in range', () => {
    const image = render('monstera', 42, 10);
    expect(image.pixels).toHaveLength(image.width * image.height);
    expect(image.potStyle).toBeGreaterThanOrEqual(0);
    expect(image.potStyle).toBeLessThan(6);
  });
});
