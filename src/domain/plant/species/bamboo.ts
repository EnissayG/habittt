import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import type { Species } from '../species';
import { sin } from '../trig';
import { lanes } from './shared';

// Three to five canes sharing the days, one row at a time, with a node and
// a small leafy twig every 6 rows. Spiral bamboo canes wave left and right.

export const bamboo: Species = {
  id: 'bamboo',
  hanging: false,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const count = 3 + Math.floor(r() * 3);
    const spiral = r() < 0.35;
    const variety = `${spiral ? 'spiral-' : ''}${count}-canes`;

    const xs: number[] = [];
    const phases: number[] = [];
    for (let i = 0; i < count; i++) {
      xs.push(Math.round(CX - 1 + (i - (count - 1) / 2) * (count > 4 ? 4 : 5)));
      phases.push(Math.floor(r() * 6));
    }
    const grown = new Array<number>(count).fill(0);
    const next = lanes(r, count, () => 46, 4);

    for (let d = 0; d < MAX_GROWTH_DAYS; d++) {
      const v = next();
      const h = grown[v]!++;
      const phase = phases[v]!;
      const x = xs[v]! + (spiral ? Math.round(1.6 * sin((h + phase * 2) / 2.6)) : 0);
      const y = T - 1 - h;
      const node = (h + phase) % 6 === 5;
      add(d, x, y, node ? 'leafDark' : 'leafLight');
      add(d, x + 1, y, node ? 'leafDark' : 'leaf');
      if (node) {
        const sd = ((h + phase + 1) / 6) % 2 ? 1 : -1;
        const bx = sd > 0 ? x + 2 : x - 1;
        add(d, bx, y - 1, 'leaf');
        add(d, bx + sd, y - 2, 'leafLight');
        add(d, bx + 2 * sd, y - 2, 'leaf');
      }
    }

    return { plan: plan.build(), variety };
  },
};
