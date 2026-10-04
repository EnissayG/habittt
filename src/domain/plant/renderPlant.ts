import { computeGenome, potHalfWidths, traitPercent, type Genome } from './genome';
import {
  MAX_GROWTH_DAYS,
  PLANT_GRID,
  type PlantImage,
  type PlantPixel,
  type PlantTone,
  type Tone,
} from './grid';
import type { GrowthPlan } from './growthPlan';
import { fnv1a, mulberry32 } from './random';
import { resolveSpecies } from './registry';
import { paintScenery, SCENERY_DEPTH, SHELF_ROWS } from './scenery';
import { settle } from './settle';

/** Row of the pot rim for hanging plants: high on the canvas so they drape down. */
const HANGING_RIM_Y = 8;

/** Tones that the rare trait may recolor. */
const TRAIT_TONES: ReadonlySet<PlantTone> = new Set([
  'leafLight',
  'leaf',
  'succulent',
  'succulentLight',
  'leafPale',
]);

export interface RenderPlantParams {
  /** Species id as stored; unknown ids fall back without throwing. */
  species: string;
  seed: number;
  /** Days grown so far (= HabitStats.totalDays). 0 or less: empty pot. */
  elapsedDays: number;
  /** Day numbers (1 = start day) that hold an active relapse. */
  relapseDays: Iterable<number>;
}

export interface PlanForSeed {
  /** Settled plan: entry 0 holds day 1. */
  plan: GrowthPlan;
  variety: string | null;
  genome: Genome;
  species: string;
  fallback: boolean;
  onTray: boolean;
  anchorX: number;
  rimY: number;
}

/**
 * The full 120-day plan of a plant, settled so every day stays visible.
 * Independent of elapsed days and relapses. Same steps, in the same order,
 * as render() in the prototype.
 */
export function planPlant(speciesId: string, seed: number): PlanForSeed {
  const { species, fallback } = resolveSpecies(speciesId);
  const { width, height } = PLANT_GRID;
  const onTray = species.tray === true;

  // Salting with the species id gives two habits with the same seed but
  // different species unrelated random sequences.
  const random = mulberry32(fnv1a(species.id) ^ Math.imul(seed | 0, 2654435761));
  // The prototype used to draw the pot style here; the draw is kept so that
  // every species' sequence stays the same.
  random();
  const genome = computeGenome(species.id, seed, onTray);
  const halfWidths = potHalfWidths(genome.potShape);

  const anchorX = Math.floor(width / 2);
  const rimY = species.hanging ? HANGING_RIM_Y : height - SCENERY_DEPTH;
  const built = species.build({ random, width, height, anchorX, rimY });

  let raw = built.plan;
  if (genome.mirrored) {
    raw = raw.map((strokes) => strokes.map((s) => ({ ...s, x: 2 * anchorX - s.x })));
  }
  const percent = traitPercent(genome.trait);
  if (percent > 0) {
    raw = raw.map((strokes) =>
      strokes.map((s) =>
        TRAIT_TONES.has(s.tone) && fnv1a(`${s.x >> 1}:${s.y >> 1}:${genome.salt}`) % 100 < percent
          ? { ...s, tone: 'trait' as const }
          : s,
      ),
    );
  }

  const plan = settle(raw, {
    width,
    height,
    anchorX,
    rimY,
    potHalfWidths: halfWidths,
    shelfRows: SHELF_ROWS,
  });

  return {
    plan,
    variety: built.variety,
    genome,
    species: species.id,
    fallback,
    onTray,
    anchorX,
    rimY,
  };
}

export function renderPlant(params: RenderPlantParams): PlantImage {
  const { width, height } = PLANT_GRID;
  const { plan, variety, genome, species, fallback, onTray, anchorX, rimY } = planPlant(
    params.species,
    params.seed,
  );
  const relapseDays = new Set(params.relapseDays);

  const pixels: (PlantPixel | null)[] = new Array<PlantPixel | null>(width * height).fill(null);
  const paint = (x: number, y: number, tone: Tone, day: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    pixels[y * width + x] = { tone, day, relapse: relapseDays.has(day) };
  };

  paintScenery((x, y, tone) => paint(x, y, tone, 0), anchorX, rimY, width, {
    halfWidths: potHalfWidths(genome.potShape),
    pattern: genome.potPattern,
    onTray,
  });

  // Days are painted in order: a later day may cover an earlier pixel, never
  // the other way round. The settled plan has no stroke behind the pot.
  const lastDay = Math.min(Math.max(0, Math.floor(params.elapsedDays)), MAX_GROWTH_DAYS);
  for (let day = 1; day <= lastDay; day++) {
    for (const { x, y, tone } of plan[day - 1] ?? []) paint(x, y, tone, day);
  }

  return { width, height, pixels, species, variety, genome, fallback };
}
