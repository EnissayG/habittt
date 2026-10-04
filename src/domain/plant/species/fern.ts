import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import { path, type Point } from '../raster';
import type { Species } from '../species';
import { sin } from '../trig';

// Arching fronds every 8 days, alternating sides, with leaflets along the
// rib. Boston ferns are upright or drooping; the maidenhair fern has a dark
// rib and small offset leaflets.

export const fern: Species = {
  id: 'fern',
  hanging: false,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const hair = r() < 0.35;
    const droop = 1.7 + r() * 1.3;
    const scale = 0.75 + r() * 0.45;
    const drooping = droop > 2.5;
    const variety = hair ? 'maidenhair' : drooping ? 'boston-drooping' : 'boston-upright';

    for (let k = 0; k * 8 < MAX_GROWTH_DAYS; k++) {
      const d0 = k * 8;
      const side = k % 2 ? 1 : -1;
      const L = Math.min(21, (7 + r() * 13) * scale);
      const hm = (9 + r() * 13 + k * 0.6) * (drooping ? 0.8 : 1.15);
      const samples: Point[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        samples.push([CX + side * (1 + L * t), Math.max(2, T - 1 - hm * sin(t * droop))]);
      }
      const frond = path(samples);

      frond.forEach(([x, y], i) => {
        const d = d0 + Math.floor((i * 8) / frond.length);
        add(d, x, y, hair ? 'leafDeep' : 'leafDark');
        if (!(i > 2 && i % 2 === 0 && i < frond.length - 2)) return;

        const vertical = frond[i + 1]![0] !== x;
        const long = !hair && i % 4 === 0 && i < frond.length - 6;
        const leaflet = hair ? 'leafLight' : 'leaf';
        if (hair) {
          const o = i % 4 === 0 ? -1 : 1;
          if (vertical) {
            add(d, x, y + o, 'leafLight');
            add(d, x + 1, y + 2 * o, 'leaf');
          } else {
            add(d, x + o, y, 'leafLight');
            add(d, x + 2 * o, y - 1, 'leaf');
          }
        } else if (vertical) {
          add(d, x, y - 1, leaflet);
          add(d, x, y + 1, leaflet);
          if (long) {
            add(d, x, y - 2, 'leafLight');
            add(d, x, y + 2, 'leafLight');
          }
        } else {
          add(d, x - 1, y, leaflet);
          add(d, x + 1, y, leaflet);
          if (long) {
            add(d, x - 2, y, 'leafLight');
            add(d, x + 2, y, 'leafLight');
          }
        }
      });
    }

    return { plan: plan.build(), variety };
  },
};
