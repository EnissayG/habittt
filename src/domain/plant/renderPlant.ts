import { computeGenome, potHalfWidths, traitPercent, type Genome } from './genome';
import {
  MAX_GROWTH_DAYS,
  PLANT_GRID,
  type PlantImage,
  type PlantPixel,
  type PlantTone,
  type Tone,
} from './grid';
import { cellKey, type GrowthPlan, type PartSpec, type PartTag } from './growthPlan';
import { fnv1a, mulberry32 } from './random';
import { resolveSpecies } from './registry';
import { paintScenery, SCENERY_DEPTH, SHELF_ROWS } from './scenery';
import { settle } from './settle';
import { wither } from './wither';

/** Row of the pot rim for hanging plants: high on the canvas so they drape down. */
const HANGING_RIM_Y = 8;

/** Row of the pot rim (soil line) for a standing or a hanging plant. */
export function rimRow(hanging: boolean): number {
  return hanging ? HANGING_RIM_Y : PLANT_GRID.height - SCENERY_DEPTH;
}

/** First and last rows of the shelf board under a plant's pot. */
export function shelfRowsUnderPot(hanging: boolean): readonly [number, number] {
  const rim = rimRow(hanging);
  return [rim + SHELF_ROWS[0], rim + SHELF_ROWS[1]];
}

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
  /** Day numbers (1 = start day) when the plant was watered: each blooms once. */
  wateredDays?: Iterable<number>;
  /** The life of this plant is over (ADR 0013): it is drawn dried (see wither). */
  dead?: boolean;
  /**
   * The part in the middle of its gesture (see gesture.ts): drawn moved by
   * its own offset. A dead plant never moves.
   */
  gesture?: number | null;
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
  /** Seconds between two gestures (see Species.rest). */
  rest: number;
  /** The parts that can make a gesture, as the plant is drawn (mirrored if it is). */
  parts: readonly PartSpec[];
  /** For each day, the part of each stroke of `plan` (null: none), in the same order. */
  partOf: readonly (readonly (PartTag | null)[])[];
}

/** Number of plans kept in memory (a shelf full of plants, plus margin). */
const PLAN_CACHE_SIZE = 64;
const planCache = new Map<string, PlanForSeed>();

/**
 * The full 120-day plan of a plant, settled so every day stays visible.
 * Independent of elapsed days and relapses, so it is computed once per
 * (species, seed) and reused: settling can take tens of milliseconds, while
 * painting a plan is cheap. Same output either way (the function is pure).
 */
export function planPlant(speciesId: string, seed: number): PlanForSeed {
  const key = `${speciesId}|${seed}`;
  const cached = planCache.get(key);
  if (cached) {
    // Re-insert to keep the most recently used entries at the end.
    planCache.delete(key);
    planCache.set(key, cached);
    return cached;
  }
  const result = computePlan(speciesId, seed);
  planCache.set(key, result);
  if (planCache.size > PLAN_CACHE_SIZE) planCache.delete(planCache.keys().next().value!);
  return result;
}

/** Same steps, in the same order, as render() in the prototype. */
function computePlan(speciesId: string, seed: number): PlanForSeed {
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
  const rimY = rimRow(species.hanging);
  const built = species.build({ random, width, height, anchorX, rimY });

  let raw = built.plan;
  let parts = built.parts.specs;
  if (genome.mirrored) {
    raw = raw.map((strokes) => strokes.map((s) => ({ ...s, x: 2 * anchorX - s.x })));
    parts = parts.map((part) => ({ ...part, dx: part.dx === 0 ? 0 : -part.dx }));
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

  // Settling keeps the strokes where they were planned (it only drops or,
  // rarely, adds some): each one finds its part again by its day and cell.
  const partOf = plan.map((strokes, day) =>
    strokes.map(({ x, y }) => {
      const planned = genome.mirrored ? 2 * anchorX - x : x;
      return built.parts.tags[day]?.get(cellKey(planned, y)) ?? null;
    }),
  );

  return {
    plan,
    variety: built.variety,
    genome,
    species: species.id,
    fallback,
    onTray,
    anchorX,
    rimY,
    rest: species.rest,
    parts,
    partOf,
  };
}

/** How each image was made: what a gesture needs to draw it again (see gesture.ts). */
const RECIPES = new WeakMap<PlantImage, RenderPlantParams>();

/** The parameters an image was rendered with (undefined for an image built by hand). */
export function recipeOf(image: PlantImage): RenderPlantParams | undefined {
  return RECIPES.get(image);
}

/** Pot and soil: a moving part never draws over them. */
const POT_TONES: ReadonlySet<Tone> = new Set<Tone>([
  'soil',
  'pot',
  'potShade',
  'potPattern',
  'potPatternShade',
]);

export function renderPlant(params: RenderPlantParams): PlantImage {
  const { width, height } = PLANT_GRID;
  const { plan, variety, genome, species, fallback, onTray, anchorX, rimY, parts, partOf } =
    planPlant(params.species, params.seed);
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
  const dead = params.dead ?? false;
  const moving = dead ? null : (params.gesture ?? null);
  const spec = moving === null ? undefined : parts[moving];
  // With a tail, only the end of the part moves: its highest ranks so far.
  let from = -Infinity;
  if (spec?.tail !== undefined) {
    let highest = -Infinity;
    for (let day = 1; day <= lastDay; day++) {
      for (const tag of partOf[day - 1] ?? []) {
        if (tag?.part === moving && tag.rank > highest) highest = tag.rank;
      }
    }
    from = highest - spec.tail;
  }
  for (let day = 1; day <= lastDay; day++) {
    const tags = partOf[day - 1] ?? [];
    (plan[day - 1] ?? []).forEach(({ x, y, tone }, i) => {
      const tag = tags[i];
      if (!spec || !tag || tag.part !== moving || tag.rank <= from) {
        paint(x, y, tone, day);
        return;
      }
      if (spec.hide) return;
      const mx = x + spec.dx;
      const my = y + spec.dy;
      const outside = mx < 0 || my < 0 || mx >= width || my >= height;
      const below = outside ? null : pixels[my * width + mx];
      // It stays in place rather than leaving the grid or covering the pot.
      if (outside || (below && POT_TONES.has(below.tone))) paint(x, y, tone, day);
      else paint(mx, my, tone, day);
    });
  }

  // A watered day blooms on its highest visible pixel (leftmost on a tie):
  // the tip of what grew that day. Nothing moves; one pixel changes color.
  const watered = new Set(params.wateredDays ?? []);
  if (watered.size > 0) {
    const bloomed = new Set<number>();
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      if (!pixel || pixel.day === 0 || !watered.has(pixel.day) || bloomed.has(pixel.day)) continue;
      bloomed.add(pixel.day);
      pixels[i] = { ...pixel, bloom: true };
    }
  }

  const halfWidths = potHalfWidths(genome.potShape);
  const image: PlantImage = {
    width,
    height,
    pixels: dead
      ? wither(pixels, {
          width,
          height,
          rimY,
          anchorX,
          potHalfWidth: Math.max(...halfWidths),
          salt: genome.salt,
        })
      : pixels,
    species,
    variety,
    genome,
    fallback,
    dead,
  };
  // Lists are copied: the recipe can be followed again, whatever was passed.
  RECIPES.set(image, {
    ...params,
    relapseDays: [...relapseDays],
    wateredDays: [...watered],
    gesture: null,
  });
  return image;
}
