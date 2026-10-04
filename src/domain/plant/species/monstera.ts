import { MAX_GROWTH_DAYS, type PlantTone } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import { path, type Point } from '../raster';
import type { Species } from '../species';
import { cos, sin } from '../trig';

// Large leaves on curved petioles, alternating sides and rising in a fan.
// Holes appear as the plant matures: Deliciosa gets inner holes then edge
// notches, Adansonii (smaller, faster leaves) gets rows of small holes.

const DELICIOSA_SHAPE = [3, 5, 6, 7, 7, 7, 6, 6, 5, 4, 3, 2, 1];
const ADANSONII_SHAPE = [2, 3, 4, 4, 4, 4, 4, 3, 3, 2, 1];
const SPREADS = [0.2, 0.62, 1.0];

export const monstera: Species = {
  id: 'monstera',
  hanging: false,
  build({ random: r, anchorX: CX, rimY: T, width: W }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const adansonii = r() < 0.4;
    const shape = adansonii ? ADANSONII_SHAPE : DELICIOSA_SHAPE;
    const per = adansonii ? 7 : 10;
    const wide = 0.75 + r() * 0.6;
    const grow = adansonii ? 1.55 : 2.5;

    for (let k = 0; k * per < MAX_GROWTH_DAYS; k++) {
      const d0 = k * per;
      const side = k % 2 ? 1 : -1;
      const sc = Math.min(1, (adansonii ? 0.6 : 0.45) + k * 0.065);
      const rows = Math.max(5, Math.round(shape.length * sc));
      const spread = (SPREADS[k % 3]! + (r() - 0.5) * 0.16) * wide;
      const R = 9 + k * grow + r() * 2;
      const tx = Math.max(8, Math.min(W - 9, Math.round(CX + side * R * sin(spread))));
      const ty = Math.max(3, Math.round(T - 1 - R * cos(spread) * 0.95));

      // Petiole: a quadratic curve from the stem to the leaf.
      const mx = CX + side * (1 + (k % 3));
      const samples: Point[] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        samples.push([mx + (tx - mx) * t * t, T - 1 + (ty - (T - 1)) * (1 - (1 - t) * (1 - t))]);
      }
      const petiole = path(samples);
      const cut = Math.floor(per * 0.4);
      petiole.forEach(([x, y], i) =>
        add(d0 + Math.floor((i * cut) / petiole.length), x, y, 'leafDark'),
      );

      const blade: [number, number, PlantTone][] = [];
      for (let i = 0; i < rows; i++) {
        const hw = Math.max(
          1,
          Math.round(shape[Math.min(shape.length - 1, Math.round(i / sc))]! * sc),
        );
        const y = ty + i;
        const lean = side * Math.floor(i / 4);
        for (let dx = -hw; dx <= hw; dx++) {
          const ax = Math.abs(dx);
          const x = tx + dx + lean;
          if (i === 0 && ax === 0) continue;
          if (adansonii) {
            if (
              k >= 1 &&
              ax >= 1 &&
              ax <= hw - 1 &&
              (i + ax * 2) % 3 === 0 &&
              i > 0 &&
              i < rows - 2
            ) {
              continue;
            }
          } else {
            if (k >= 3 && ax >= 2 && ax <= hw - 2 && (i + ax) % 3 === 0 && i > 0 && i < rows - 3) {
              continue;
            }
            if (k >= 6 && ax === hw && i % 3 === 1 && i > 1 && i < rows - 2) continue;
          }
          blade.push([
            x,
            y,
            ax === hw ? 'leafDeep' : ax === 0 ? 'leafDark' : dx * side < 0 ? 'leafLight' : 'leaf',
          ]);
        }
      }
      blade.forEach(([x, y, tone], i) =>
        add(d0 + cut + Math.floor((i * (per - cut)) / blade.length), x, y, tone),
      );
    }

    return { plan: plan.build(), variety: adansonii ? 'adansonii' : 'deliciosa' };
  },
};
