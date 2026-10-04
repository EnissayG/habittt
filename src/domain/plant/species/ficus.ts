import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import type { Species } from '../species';

// A rubber plant: a wavering stem that grows one leaf every 5 days
// (node, sheath, blade, tip, highlight), alternating sides. Branched plants
// split into two stems after a few leaves; some have longer leaves.

const DRIFT_LENGTH = 60;

export const ficus: Species = {
  id: 'ficus',
  hanging: false,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const bias = (r() - 0.5) * 0.5;
    const split = r() < 0.5 ? 5 + Math.floor(r() * 5) : 99;
    const long = r() < 0.5;
    const variety = `${split < 99 ? 'branched' : 'single-stem'}${long ? '-long-leaf' : ''}`;

    const drift: number[] = [];
    let offset = 0;
    for (let j = 0; j < DRIFT_LENGTH; j++) {
      if (j % 4 === 3) {
        const t = r() + bias;
        offset += t > 0.7 ? 1 : t < 0.3 ? -1 : 0;
        offset = Math.max(-5, Math.min(5, offset));
      }
      drift.push(offset);
    }
    const at = (j: number) => drift[j] as number;

    for (let d = 0; d < MAX_GROWTH_DAYS; d++) {
      const c = Math.floor(d / 5);
      const phase = d % 5;
      let j: number;
      let sx: number;
      let px: number;
      let sd: number;
      if (c < split) {
        j = 2 * c + 1;
        sx = CX + at(j);
        px = CX + at(j - 1);
        sd = c % 2 ? 1 : -1;
      } else {
        // After the split, the two stems take turns, spreading apart.
        const e = c - split;
        const s = e % 2 ? 1 : -1;
        const i = Math.floor(e / 2);
        const b = 2 * split;
        j = b + 1 + 2 * i;
        sx = CX + at(b) + s * (2 + Math.min(i, 4)) + (at(j) - at(b));
        px =
          i === 0
            ? CX + at(b) + s
            : CX + at(b) + s * (2 + Math.min(i - 1, 4)) + (at(j - 2) - at(b));
        sd = s;
      }
      const y = T - 1 - j;
      const tipEnd = long ? 6 : 5;

      if (phase === 0) {
        add(d, px, y + 1, 'bark');
        if (px !== sx) add(d, sx, y + 1, 'bark');
      }
      if (phase === 1) {
        add(d, sx, y, 'bark');
        add(d, sx + sd, y, 'bud');
      }
      if (phase === 2) {
        for (let i = 1; i <= 3; i++) add(d, sx + sd * i, y, 'leafDeep');
        add(d, sx + sd * 2, y - 1, 'leafDark');
        add(d, sx + sd * 3, y - 1, 'leafDark');
        add(d, sx + sd * 2, y + 1, 'leafDeep');
        add(d, sx + sd * 3, y + 1, 'leafDeep');
      }
      if (phase === 3) {
        for (let i = 4; i < tipEnd; i++) {
          add(d, sx + sd * i, y, 'leafDeep');
          add(d, sx + sd * i, y - 1, 'leafDark');
          if (i < tipEnd - 1 || !long) add(d, sx + sd * i, y + 1, 'leafDeep');
        }
        add(d, sx + sd * tipEnd, y, 'leafDark');
      }
      if (phase === 4) {
        add(d, sx + sd * 2, y - 1, 'leafLight');
        add(d, sx + sd * 3, y - 1, 'leaf');
      }
    }

    return { plan: plan.build(), variety };
  },
};
