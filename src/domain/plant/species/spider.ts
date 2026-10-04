import { MAX_GROWTH_DAYS, type PlantTone } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import { path, type Point } from '../raster';
import type { Species } from '../species';
import { sin } from '../trig';

// Arching leaves, one every 4 days, alternating sides. Every few leaves a
// long runner carries a baby plant at its tip. Bonnie has short curly
// leaves; Variegatum and Vittatum differ by where the pale stripe runs.

/** Baby plant at a runner's tip: [dx, dy, tone]. */
const BABY: readonly (readonly [number, number, PlantTone])[] = [
  [0, 0, 'spine'],
  [-1, -1, 'leaf'],
  [1, -1, 'leaf'],
  [-1, 1, 'leaf'],
  [1, 1, 'leaf'],
  [0, -2, 'leafLight'],
  [-2, 0, 'leafLight'],
  [2, 0, 'leafLight'],
];

export const spider: Species = {
  id: 'spider',
  hanging: false,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const curly = r() < 0.35;
    const every = 5 + Math.floor(r() * 5);
    const reach = 0.7 + r() * 0.6;
    const edgeStripe = r() < 0.5;
    const variety = curly ? 'bonnie' : edgeStripe ? 'variegatum' : 'vittatum';

    for (let k = 0; k * 4 < MAX_GROWTH_DAYS; k++) {
      const d0 = k * 4;
      const side = k % 2 ? 1 : -1;
      const runner = k % every === every - 1;
      const L = (runner ? 19 : 4 + r() * 14) * (curly && !runner ? 0.6 : reach);
      const hm = runner ? 15 : (8 + r() * 11) * (curly ? 0.8 : 1);
      const w = runner ? 3.0 : curly ? 3.3 : 2.6;

      const samples: Point[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        samples.push([
          CX + side * (1 + Math.min(21, L) * t),
          Math.min(T - 1, T - 1 - hm * sin(t * w)),
        ]);
      }
      const leaf = path(samples);
      const base = k % 3 === 2 ? 'leafLight' : 'leaf';
      leaf.forEach(([x, y], i) => {
        const striped = edgeStripe ? k % 2 === 0 && i % 2 === 0 : k % 3 === 1 && i % 3 === 1;
        add(
          d0 + Math.floor((i * 4) / leaf.length),
          x,
          y,
          runner ? 'leafDark' : striped ? 'stripe' : base,
        );
      });

      if (runner) {
        const [ex, ey] = leaf[leaf.length - 1]!;
        for (const [dx, dy, tone] of BABY) add(d0 + 3, ex + dx, ey + dy, tone);
      }
    }

    return { plan: plan.build(), variety };
  },
};
