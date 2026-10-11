import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import type { Species } from '../species';
import { cos, sin } from '../trig';

// A rosette: thick leaves every 6 days, alternating sides, each pair a
// little more upright, so the rosette closes towards the center.

export const aloe: Species = {
  id: 'aloe',
  hanging: false,
  rest: 10,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const close = 0.08 + r() * 0.08;
    const baseLength = 8 + Math.floor(r() * 7);

    for (let k = 0; k * 6 < MAX_GROWTH_DAYS; k++) {
      const d0 = k * 6;
      const side = k % 2 ? 1 : -1;
      const a = Math.max(0.08, 1.25 - close * Math.floor(k / 2) + (r() - 0.5) * 0.1);
      const length = baseLength + Math.floor(r() * 4) + Math.floor(k / 2);

      // Gesture: the tip of one leaf leans outwards, then comes back.
      const part = plan.part({ dx: side, dy: 0, tail: 3 });
      for (let p = 0; p < length; p++) {
        plan.mark(part, p);
        const x = Math.round(CX + side * sin(a) * p);
        const y = Math.round(T - 1 - cos(a) * p - ((p * p) / (length * 2.2)) * sin(a));
        const d = d0 + Math.floor((p * 6) / length);
        add(d, x, y, p > length * 0.8 ? 'succulentLight' : 'succulent');
        if (p < length * 0.8) add(d, x + side, y, p % 5 === 2 ? 'succulentLight' : 'succulentDark');
        if (p < length * 0.5) add(d, x - side, y, 'succulentLight');
      }
      plan.mark(null);
    }

    return { plan: plan.build(), variety: null, parts: plan.parts() };
  },
};
