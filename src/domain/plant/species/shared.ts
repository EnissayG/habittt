import type { PlantTone } from '../grid';
import type { Random } from '../random';

// Helpers shared by several species, ported from the prototype.

/** Adds a stroke on a 0-based day index (0 = day 1). */
export type AddStroke = (dayIndex: number, x: number, y: number, tone: PlantTone) => void;

/** Picks one element uniformly. Repeating an element in the list weights it. */
export function choose<T>(random: Random, list: readonly T[]): T {
  return list[Math.floor(random() * list.length)]!;
}

/**
 * Spreads the days over several stems: each stem gets a random weight
 * (1..maxWeight), the stems' turns are shuffled, and a stem whose capacity
 * (`cap`) is used up gives its turn to the next one. Returns a function that
 * says which stem grows next.
 */
export function lanes(
  random: Random,
  stems: number,
  cap: (stem: number) => number,
  maxWeight: number,
): () => number {
  const order: number[] = [];
  for (let stem = 0; stem < stems; stem++) {
    const weight = 1 + Math.floor(random() * maxWeight);
    for (let i = 0; i < weight; i++) order.push(stem);
  }
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }

  const used = new Array<number>(stems).fill(0);
  let position = 0;
  return () => {
    for (let t = 0; t < order.length; t++) {
      const stem = order[(position + t) % order.length]!;
      if (used[stem]! < cap(stem)) {
        position += t + 1;
        used[stem]!++;
        return stem;
      }
    }
    const stem = order[position++ % order.length]!;
    used[stem]!++;
    return stem;
  };
}

/** A small crown of foliage on top of the pot, all on the first day. */
export function crown(
  add: AddStroke,
  anchorX: number,
  rimY: number,
  a: PlantTone,
  b: PlantTone,
): void {
  for (let x = anchorX - 5; x <= anchorX + 5; x++) add(0, x, rimY - 1, x & 1 ? a : b);
  for (let x = anchorX - 3; x <= anchorX + 3; x++) add(0, x, rimY - 2, x & 1 ? b : a);
}
