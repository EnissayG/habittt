import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import { line } from '../raster';
import type { Species } from '../species';
import { cos, sin } from '../trig';

// A small tree: a trunk that forks four times (planned breadth-first), grown
// two cells every other day, with foliage clusters on the other days. Once
// the wood is done, every day adds foliage.
// Angles use the deterministic sin/cos of trig.ts.

const MAX_DEPTH = 4;
const MIN_ANGLE = -2.7;
const MAX_ANGLE = -0.45;

interface Branch {
  x: number;
  y: number;
  angle: number;
  length: number;
  depth: number;
}

interface WoodCell {
  x: number;
  y: number;
  depth: number;
  /** Last cell of a branch: foliage can grow here. */
  tip: boolean;
}

export const jade: Species = {
  id: 'jade',
  hanging: false,
  build({ random, anchorX, rimY }) {
    const plan = new GrowthPlanBuilder();

    // 1. Plan all the wood, trunk first, then each level of branches.
    const wood: WoodCell[] = [];
    const queue: Branch[] = [
      {
        x: anchorX,
        y: rimY - 1,
        angle: -Math.PI / 2 + (random() - 0.5) * 0.3,
        length: 10,
        depth: 0,
      },
    ];
    while (queue.length > 0) {
      const branch = queue.shift()!;
      const endX = branch.x + cos(branch.angle) * branch.length;
      const endY = branch.y + sin(branch.angle) * branch.length;
      const cells = line(branch.x, branch.y, endX, endY);
      cells.forEach(([x, y], i) =>
        wood.push({ x, y, depth: branch.depth, tip: i === cells.length - 1 }),
      );
      if (branch.depth < MAX_DEPTH) {
        for (const turn of [-1, 1]) {
          const spread = 0.45 + random() * 0.35;
          queue.push({
            x: endX,
            y: endY,
            angle: Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, branch.angle + turn * spread)),
            length: Math.max(5, branch.length * 0.8),
            depth: branch.depth + 1,
          });
        }
      }
    }

    // 2. Spread it over the days.
    let next = 0;
    const tips: WoodCell[] = [];

    const growWood = (day: number): boolean => {
      const cell = wood[next];
      if (!cell) return false;
      next++;
      plan.add(day, cell.x, cell.y, 'bark');
      if (cell.depth <= 1) plan.add(day, cell.x + 1, cell.y, 'bark'); // thicker trunk
      if (cell.depth === 0) plan.add(day, cell.x - 1, cell.y, 'bark');
      if (cell.tip && cell.depth >= 1) tips.push(cell);
      return true;
    };

    const growFoliage = (day: number) => {
      // Biased towards recent tips: random() * random() favours small values.
      const tip = tips[tips.length - 1 - Math.floor(random() * random() * tips.length)]!;
      const x = tip.x + Math.floor(random() * 5) - 2;
      const y = tip.y + Math.floor(random() * 4) - 3;
      plan.add(day, x, y, 'leafLight');
      plan.add(day, x + 1, y, 'leaf');
      plan.add(day, x, y + 1, 'leaf');
      plan.add(day, x + 1, y + 1, 'leafDark');
    };

    for (let d = 0; d < MAX_GROWTH_DAYS; d++) {
      const day = d + 1;
      if (d % 2 === 0 || tips.length === 0) {
        const grewA = growWood(day);
        const grewB = growWood(day);
        if (!grewA && !grewB && tips.length > 0) growFoliage(day);
      } else {
        growFoliage(day);
      }
    }

    return { plan: plan.build(), variety: null };
  },
};
