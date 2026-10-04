import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import type { Species } from '../species';
import { crown, lanes } from './shared';

// A hanging plant: a crown above the pot, then two to four vines that drape
// down, each wandering left or right. A vine grows in 3-day cycles: stem,
// then a bud, then a leaf. Large-leaf pothos have bigger leaves and fewer
// cycles per row.

/** [start x offset, start y offset, drift bias] of each possible vine. */
const ANCHORS = [
  [9, 0, 0.22],
  [-9, 0, -0.22],
  [3, 11, 0.1],
  [-4, 11, -0.1],
] as const;

const DRIFT_LENGTH = 70;

export const pothos: Species = {
  id: 'pothos',
  hanging: true,
  build({ random: r, anchorX: CX, rimY: T, height: H }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    crown(add, CX, T, 'leaf', 'leafLight');

    const big = r() < 0.5;
    const step = big ? 3 : 2;
    const vineCount = big ? 3 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3);
    const anchors = ANCHORS.slice(0, vineCount).map(([dx, dy, bias]) => ({
      x: CX + dx,
      y: dy,
      bias,
    }));

    // Each vine's horizontal drift, decided once for its whole length.
    const drift = anchors.map(({ bias }) => {
      const offsets: number[] = [];
      let x = 0;
      for (let j = 0; j < DRIFT_LENGTH; j++) {
        if (j % 4 === 3) {
          const t = r() + bias;
          x += t > 0.66 ? 1 : t < 0.33 ? -1 : 0;
        }
        offsets.push(x);
      }
      return offsets;
    });

    const next = lanes(
      r,
      vineCount,
      (v) => Math.floor((H - 4 - T - 2 - anchors[v]!.y) / step) * 3,
      3,
    );
    const grown = anchors.map(() => 0);

    for (let d = 0; d < MAX_GROWTH_DAYS; d++) {
      // The first vine grows alone for the first days (the turn is still drawn).
      const v = d < 9 ? (next(), 0) : next();
      const anchor = anchors[v]!;
      const offsets = drift[v]!;
      const m = grown[v]!++;
      const t = Math.floor(m / 3);
      const phase = m % 3;
      const j = t * step + step - 1;
      // Past the drift table the offset is undefined: the stroke becomes NaN
      // and is dropped when the plan is settled, exactly as in the prototype.
      const x = anchor.x + (offsets[j] as number);
      const y = T + 2 + anchor.y + j;
      const sd = t % 2 ? 1 : -1;

      if (phase === 0) {
        for (let q = 0; q < step; q++) {
          add(d, anchor.x + (offsets[j - q] as number), y - q, 'leafDark');
        }
      }
      if (phase === 1) add(d, x + sd, y, 'leafLight');
      if (phase === 2 && big) {
        add(d, x + sd, y - 1, 'leafLight');
        add(d, x + 2 * sd, y - 1, 'leaf');
        add(d, x + 2 * sd, y, 'leaf');
        add(d, x + 3 * sd, y, 'leafDark');
        add(d, x + 2 * sd, y + 1, 'leafDark');
      }
      if (phase === 2 && !big) {
        add(d, x + sd, y - 1, 'leaf');
        add(d, x + 2 * sd, y, 'leafDark');
      }
    }

    return { plan: plan.build(), variety: big ? 'large-leaf' : 'small-leaf' };
  },
};
