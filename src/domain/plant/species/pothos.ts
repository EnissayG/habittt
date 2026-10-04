import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import type { Species } from '../species';

// A hanging plant: a small crown above the pot, then up to three vines that
// drape down, each one wandering left or right as it grows. A vine grows in
// 3-day cycles: stem, then a bud, then a full leaf.

const VINE_LENGTH = 70;

export const pothos: Species = {
  id: 'pothos',
  hanging: true,
  build({ random, anchorX, rimY }) {
    const plan = new GrowthPlanBuilder();

    // Crown of foliage on top of the pot, all on day 1.
    for (let x = anchorX - 5; x <= anchorX + 5; x++)
      plan.add(1, x, rimY - 1, x & 1 ? 'leaf' : 'leafLight');
    for (let x = anchorX - 3; x <= anchorX + 3; x++)
      plan.add(1, x, rimY - 2, x & 1 ? 'leafLight' : 'leaf');

    const vines = [
      { startX: anchorX + 9, bias: 0.22, startY: rimY + 2 },
      { startX: anchorX - 9, bias: -0.22, startY: rimY + 2 },
      { startX: anchorX + 2, bias: 0, startY: rimY + 11 },
    ];

    // Each vine's horizontal drift, decided once for its whole length.
    const drift = vines.map(({ bias }) => {
      const offsets: number[] = [];
      let x = 0;
      for (let j = 0; j < VINE_LENGTH; j++) {
        if (j % 4 === 3) {
          const t = random() + bias;
          x += t > 0.66 ? 1 : t < 0.33 ? -1 : 0;
        }
        offsets.push(x);
      }
      return offsets;
    });

    const grown = [0, 0, 0];
    for (let d = 0; d < MAX_GROWTH_DAYS; d++) {
      const day = d + 1;
      // One vine first, then two, then three take turns.
      const v = d < 30 ? 0 : d < 70 ? d % 2 : d % 3;
      const vine = vines[v]!;
      const offsets = drift[v]!;
      const step = grown[v]!++;
      const cycle = Math.floor(step / 3);
      const phase = step % 3;
      const j = cycle * 2 + 1;
      const x = vine.startX + offsets[j]!;
      const y = vine.startY + j;
      const side = cycle % 2 ? 1 : -1;

      if (phase === 0) {
        plan.add(day, vine.startX + offsets[j - 1]!, y - 1, 'leafDark');
        plan.add(day, x, y, 'leafDark');
      } else if (phase === 1) {
        plan.add(day, x + side, y, 'leafLight');
      } else {
        plan.add(day, x + side, y - 1, 'leafLight');
        plan.add(day, x + 2 * side, y - 1, 'leaf');
        plan.add(day, x + side, y, 'leaf');
        plan.add(day, x + 2 * side, y, 'leaf');
        plan.add(day, x + 3 * side, y, 'leafDark');
        plan.add(day, x + 2 * side, y + 1, 'leafDark');
      }
    }

    return { plan: plan.build(), variety: null };
  },
};
