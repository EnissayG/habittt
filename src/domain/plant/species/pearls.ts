import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import { line } from '../raster';
import type { Species } from '../species';
import { sin } from '../trig';
import { choose, crown, lanes } from './shared';

// A hanging plant: strings that drape down from the pot, one bead a day.
// The variety sets the bead's shape: pearls, dolphins or bananas.

const VARIETIES = ['pearls', 'pearls', 'dolphins', 'bananas'] as const;
const STRING_OFFSETS = [-9, 9, -12, 12, -15, 15, -18, 18];

export const pearls: Species = {
  id: 'pearls',
  hanging: true,
  build({ random: r, anchorX: CX, rimY: T, height: H }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    crown(add, CX, T, 'leafLight', 'leaf');

    const variety = choose(r, VARIETIES);
    const dolphins = variety === 'dolphins';
    const gap = dolphins ? 3 : 2.6;
    const count = dolphins ? 7 + Math.floor(r() * 2) : 6 + Math.floor(r() * 3);
    const offsets = STRING_OFFSETS.slice(0, count);
    const beads = offsets.map(() => 0);
    const startY = offsets.map(() => T + 1 + Math.floor(r() * 2));
    const phases = offsets.map(() => r() * 6);
    const next = lanes(r, count, () => Math.floor((H - 3 - T - 3) / gap), 3);

    for (let d = 0; d < MAX_GROWTH_DAYS; d++) {
      const v = next();
      const m = beads[v]!++;
      const x = CX + offsets[v]! + Math.round(sin(m * 0.5 + phases[v]!));
      const y = startY[v]! + Math.floor(m * gap);

      // The first bead of a string also draws the stem from the pot.
      if (m === 0) {
        for (const [sx, sy] of line(CX + Math.sign(offsets[v]!) * 6, T - 1, x, y)) {
          add(d, sx, sy, 'leafDark');
        }
      }
      const s = m % 2 ? 1 : -1;
      if (variety === 'pearls') {
        add(d, x, y, 'leafLight');
        add(d, x + 1, y, 'leaf');
        add(d, x, y + 1, 'leaf');
        add(d, x + 1, y + 1, 'leafDark');
      } else if (dolphins) {
        add(d, x, y, 'leafDark');
        add(d, x + s, y, 'leafLight');
        add(d, x + 2 * s, y, 'leaf');
        add(d, x + s, y - 1, 'leaf');
        add(d, x + 2 * s, y + 1, 'leafDark');
      } else {
        add(d, x, y, 'leafDark');
        add(d, x + s, y, 'leaf');
        add(d, x + 2 * s, y - 1, 'leafLight');
        add(d, x + s, y + 1, 'leafDark');
      }
    }

    return { plan: plan.build(), variety };
  },
};
