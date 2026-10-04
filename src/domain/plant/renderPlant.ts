import {
  MAX_GROWTH_DAYS,
  PLANT_GRID,
  POT_STYLE_COUNT,
  type PlantImage,
  type PlantPixel,
  type Tone,
} from './grid';
import type { GrowthPlan } from './growthPlan';
import { fnv1a, mulberry32 } from './random';
import { resolveSpecies } from './registry';
import { isBehindPot, paintScenery, SCENERY_DEPTH } from './scenery';

/** Row of the pot rim for hanging plants: high on the canvas so they drape down. */
const HANGING_RIM_Y = 8;

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
  plan: GrowthPlan;
  potStyle: number;
  species: string;
  fallback: boolean;
  anchorX: number;
  rimY: number;
}

/** The full 120-day plan of a plant. Independent of elapsed days and relapses. */
export function planPlant(speciesId: string, seed: number): PlanForSeed {
  const { species, fallback } = resolveSpecies(speciesId);
  const { width, height } = PLANT_GRID;

  // Salting with the species id gives two habits with the same seed but
  // different species unrelated random sequences.
  const random = mulberry32(fnv1a(species.id) ^ Math.imul(seed | 0, 2654435761));
  // Drawn first, so a species' own random draws never shift the pot style.
  const potStyle = Math.floor(random() * POT_STYLE_COUNT);

  const anchorX = Math.floor(width / 2);
  const rimY = species.hanging ? HANGING_RIM_Y : height - SCENERY_DEPTH;
  const plan = species.build({ random, width, height, anchorX, rimY });

  return { plan, potStyle, species: species.id, fallback, anchorX, rimY };
}

export function renderPlant(params: RenderPlantParams): PlantImage {
  const { width, height } = PLANT_GRID;
  const { plan, potStyle, species, fallback, anchorX, rimY } = planPlant(
    params.species,
    params.seed,
  );
  const relapseDays = new Set(params.relapseDays);

  const pixels: (PlantPixel | null)[] = new Array<PlantPixel | null>(width * height).fill(null);
  const paint = (x: number, y: number, tone: Tone, day: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    pixels[y * width + x] = { tone, day, relapse: relapseDays.has(day) };
  };

  paintScenery((x, y, tone) => paint(x, y, tone, 0), anchorX, rimY, width);

  // Days are painted in order: a later day may cover an earlier pixel, never
  // the other way round. Strokes behind the pot are hidden.
  const lastDay = Math.min(Math.max(0, Math.floor(params.elapsedDays)), MAX_GROWTH_DAYS);
  for (let day = 1; day <= lastDay; day++) {
    for (const { x, y, tone } of plan[day - 1] ?? []) {
      if (!isBehindPot(x, y, anchorX, rimY)) paint(x, y, tone, day);
    }
  }

  return { width, height, pixels, potStyle, species, fallback };
}
