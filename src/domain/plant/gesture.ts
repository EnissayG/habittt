import { MAX_GROWTH_DAYS, type PlantImage } from './grid';
import { fnv1a } from './random';
import { planPlant, recipeOf, renderPlant } from './renderPlant';

// A living plant keeps still, and now and then makes one small gesture of
// its own: a single part moves by one pixel for a second, then comes back.
// Which part, and how, is decided by each species when it plans its growth
// (see GrowthPlanBuilder.part): a monstera leaf dips, the end of a pothos
// vine swings, the top of a bonsai's pad shivers, a cactus only closes a
// flower. How often depends on the species' stiffness (Species.rest).
//
// Nothing is random at run time: the part that moves at time t is drawn from
// the plant's seed, like everything else about it.

/** How long a gesture lasts, in seconds. */
export const GESTURE_SECONDS = 1;

/** Strokes a part needs, grown, before it can move (fewer if it has fewer). */
const MIN_STROKES = 4;

/**
 * The parts of this plant that can make a gesture today, by number. Empty
 * for a dead plant, an empty pot, or an image that was not made by
 * renderPlant.
 */
export function gestureParts(image: PlantImage): readonly number[] {
  const cached = CANDIDATES.get(image);
  if (cached) return cached;
  const result = findParts(image);
  CANDIDATES.set(image, result);
  return result;
}

const CANDIDATES = new WeakMap<PlantImage, readonly number[]>();

function findParts(image: PlantImage): number[] {
  const recipe = recipeOf(image);
  if (!recipe || image.dead) return [];
  const { parts, partOf } = planPlant(recipe.species, recipe.seed);
  const lastDay = Math.min(Math.max(0, Math.floor(recipe.elapsedDays)), MAX_GROWTH_DAYS);

  const total = parts.map(() => 0);
  const grown = parts.map(() => 0);
  const lowest = parts.map(() => Infinity);
  const highest = parts.map(() => -Infinity);
  partOf.forEach((tags, index) => {
    for (const tag of tags) {
      if (!tag) continue;
      total[tag.part]!++;
      if (index >= lastDay) continue;
      grown[tag.part]!++;
      lowest[tag.part] = Math.min(lowest[tag.part]!, tag.rank);
      highest[tag.part] = Math.max(highest[tag.part]!, tag.rank);
    }
  });

  return parts.flatMap((spec, part) => {
    if (grown[part] === 0) return [];
    if (spec.hide) return [part];
    // The end of a part moves only once something holds it: its base.
    if (spec.tail !== undefined) return highest[part]! - lowest[part]! >= spec.tail ? [part] : [];
    return grown[part]! >= Math.min(MIN_STROKES, total[part]!) ? [part] : [];
  });
}

/**
 * The part in the middle of its gesture at time t (in seconds since the
 * plant came into view), or null while the plant keeps still, which is most
 * of the time: one gesture at the end of each rest. Each plant has its own
 * offset, so that two plants never move together for long.
 */
export function gestureAt(image: PlantImage, t: number): number | null {
  const recipe = recipeOf(image);
  if (!recipe || !(t > 0)) return null;
  const candidates = gestureParts(image);
  if (candidates.length === 0) return null;
  const { rest } = planPlant(recipe.species, recipe.seed);
  const seed = recipe.seed >>> 0;
  const time = t + ((fnv1a(`${seed}:offset`) % 1000) / 1000) * rest;
  const cycle = Math.floor(time / rest);
  if (time - cycle * rest < rest - GESTURE_SECONDS) return null;
  return candidates[fnv1a(`${seed}:${cycle}`) % candidates.length]!;
}

const MOVED = new WeakMap<PlantImage, Map<number, PlantImage>>();

/**
 * The same plant with one part in the middle of its gesture. Kept in memory
 * per image and part: a gesture lasts several frames, and comes back.
 */
export function withGesture(image: PlantImage, part: number | null): PlantImage {
  const recipe = recipeOf(image);
  if (part === null || !recipe || image.dead) return image;
  let moved = MOVED.get(image);
  if (!moved) MOVED.set(image, (moved = new Map()));
  let result = moved.get(part);
  if (!result) moved.set(part, (result = renderPlant({ ...recipe, gesture: part })));
  return result;
}

/** The plant as it is at time t: itself, or with one part moved. */
export function livingPlant(image: PlantImage, t: number): PlantImage {
  return withGesture(image, gestureAt(image, t));
}
