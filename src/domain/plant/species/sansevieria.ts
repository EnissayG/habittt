import { MAX_GROWTH_DAYS } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import type { Species } from '../species';
import { choose } from './shared';

// Blades that rise one by one, two rows a day, fanning out from the center.
// Laurentii has pale edges, Cylindrica round stems, Hahnii a low rosette.

const VARIETIES = [
  'trifasciata',
  'trifasciata',
  'laurentii',
  'laurentii',
  'cylindrica',
  'hahnii',
] as const;

export const sansevieria: Species = {
  id: 'sansevieria',
  hanging: false,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const variety = choose(r, VARIETIES);
    const cylindrical = variety === 'cylindrica';
    const rosette = variety === 'hahnii';
    const edge = variety === 'laurentii' ? 'leafPale' : 'leafDark';
    const fan = 0.4 + r() * 0.9;

    let d = 0;
    let k = 0;
    while (d < MAX_GROWTH_DAYS) {
      const length = rosette
        ? 3 + Math.floor(r() * 3)
        : cylindrical
          ? 10 + Math.floor(r() * 9)
          : 6 + Math.floor(r() * 9);
      const offset = rosette
        ? (((k * 5) % 9) - 4) * 2
        : k
          ? Math.min(7, Math.ceil(k / 2)) * (cylindrical ? 2 : 3) * (k % 2 ? -1 : 1)
          : 0;
      const lean = Math.max(
        -1.05,
        Math.min(1.05, (rosette ? offset / 5 : (offset / 16) * fan) + (r() - 0.5) * 0.4),
      );
      const halfWidth = rosette ? 2 : 1;

      for (let s = 0; s < length && d < MAX_GROWTH_DAYS; s++, d++) {
        for (let q = 0; q < 2; q++) {
          const h = s * 2 + q;
          const y = T - 1 - h;
          const x = CX + offset + Math.round((lean * h) / 3);
          const band =
            edge === 'leafPale'
              ? h % 3 === 0
                ? 'leaf'
                : 'leafDark'
              : h % 3 === 0
                ? 'leafLight'
                : 'leaf';
          const left = length * 2 - h;
          if (cylindrical) {
            add(d, x, y, h % 5 === 4 ? 'leafDark' : 'leaf');
            if (left > 3) add(d, x + 1, y, 'leafDark');
          } else {
            const w = left <= 1 ? 0 : left <= 3 ? halfWidth - 1 : halfWidth;
            for (let dx = -w; dx <= w; dx++) {
              const onEdge = w > 0 && Math.abs(dx) === w;
              add(d, x + dx, y, onEdge ? (dx < 0 && edge === 'leafDark' ? 'leaf' : edge) : band);
            }
          }
        }
      }
      k++;
    }

    return { plan: plan.build(), variety };
  },
};
