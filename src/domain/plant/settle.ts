import type { PlantTone } from './grid';
import type { GrowthPlan, Stroke } from './growthPlan';

/** Pixels each day tries to keep visible at the last day (at least 1 is guaranteed when possible). */
export const KEEP = 2;

/** Search radius when a day has to grow a new pixel. */
const SEARCH_RADIUS = 9;

export interface SettleGeometry {
  width: number;
  height: number;
  anchorX: number;
  rimY: number;
  /** Pot half-width for each of the 10 rows below the rim. */
  potHalfWidths: readonly number[];
  /** Rows below the rim where the shelf is drawn (inclusive). */
  shelfRows: readonly [number, number];
}

/**
 * Rewrites a raw growth plan so that, at the last day, every day keeps at
 * least one visible pixel (KEEP when possible). Port of settle() from the
 * prototype; the iteration order is the same (Map insertion order) so the
 * result is identical.
 *
 * 1. Each day becomes a map cell -> tone, without cells outside the grid or
 *    behind the pot; within a day, the last stroke on a cell wins.
 * 2. Every cell belongs to the LAST day that paints it (what shows at the
 *    end); each day counts the cells it owns.
 * 3. From the oldest day: while a day owns fewer than KEEP cells, it takes
 *    back one of its own cells from a later owner, preferring the owner with
 *    the most cells, never leaving that owner with fewer than 1 (or KEEP),
 *    and never emptying an intermediate day that also paints the cell. The
 *    cell is removed from every later day.
 * 4. A day that still owns nothing grows one pixel in the nearest free cell
 *    (Manhattan distance, at most 9) around its own strokes, avoiding the
 *    pot, the soil and the shelf.
 *
 * The plan is rewritten once, before any rendering, independently of the
 * elapsed days: growth stays append-only.
 */
export function settle(raw: GrowthPlan, geometry: SettleGeometry): GrowthPlan {
  const { width: W, height: H, anchorX: CX, rimY: T, potHalfWidths: potHW } = geometry;
  const [shelfTop, shelfBottom] = geometry.shelfRows;
  const N = raw.length;

  const inGrid = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  const inPot = (x: number, y: number) =>
    y > T && y <= T + potHW.length && Math.abs(x - CX) <= potHW[y - T - 1]!;
  const scenery = (x: number, y: number) =>
    inPot(x, y) ||
    (y === T && Math.abs(x - CX) <= potHW[0]! - 1) ||
    (y >= T + shelfTop && y <= T + shelfBottom);

  const days = raw.map((strokes) => {
    const cells = new Map<number, PlantTone>();
    for (const { x, y, tone } of strokes) {
      if (!inGrid(x, y) || inPot(x, y)) continue;
      cells.set(y * W + x, tone);
    }
    return cells;
  });

  const owner = new Map<number, number>();
  const count = new Array<number>(N).fill(0);
  const used = new Set<number>();
  days.forEach((cells, d) => {
    for (const cell of cells.keys()) {
      owner.set(cell, d);
      used.add(cell);
    }
  });
  for (const d of owner.values()) count[d]!++;

  for (let d = 0; d < N; d++) {
    const own = days[d]!;

    while (count[d]! < KEEP) {
      const floor = count[d] === 0 ? 1 : KEEP;
      let best = -1;
      let bestCount = floor;
      for (const cell of own.keys()) {
        const o = owner.get(cell)!;
        if (o === d || count[o]! <= bestCount) continue;
        let safe = true;
        for (let e = d + 1; e < o && safe; e++) {
          if (days[e]!.has(cell) && days[e]!.size <= 1) safe = false;
        }
        if (safe) {
          bestCount = count[o]!;
          best = cell;
        }
      }
      if (best < 0) break;
      const o = owner.get(best)!;
      for (let e = d + 1; e < N; e++) days[e]!.delete(best);
      owner.set(best, d);
      count[o]!--;
      count[d]!++;
    }

    if (count[d] === 0) {
      let found = -1;
      let tone: PlantTone = 'leaf';
      let bestDistance = 99;
      for (const stroke of raw[d]!) {
        for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
          for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
            const x = Math.max(0, Math.min(W - 1, stroke.x)) + dx;
            const y = Math.max(0, Math.min(H - 1, stroke.y)) + dy;
            const distance = Math.abs(dx) + Math.abs(dy);
            if (distance >= bestDistance || !inGrid(x, y) || scenery(x, y) || used.has(y * W + x)) {
              continue;
            }
            bestDistance = distance;
            found = y * W + x;
            tone = stroke.tone;
          }
        }
      }
      if (found >= 0) {
        own.set(found, tone);
        owner.set(found, d);
        used.add(found);
        count[d] = 1;
      }
    }
  }

  return days.map((cells) =>
    [...cells].map(([cell, tone]): Stroke => ({ x: cell % W, y: Math.floor(cell / W), tone })),
  );
}
