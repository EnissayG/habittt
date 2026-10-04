import { MAX_GROWTH_DAYS, type PlantTone } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import { line } from '../raster';
import type { Species } from '../species';
import { choose } from './shared';

// One large leaf every 10 days, alternating sides and rising: 4 days of
// petiole, then 6 days of blade. The variety sets the blade's shape and
// pattern: striped medallion with a purple edge, round orbifolia, or long
// lancifolia.

interface LeafStyle {
  id: 'medallion' | 'orbifolia' | 'lancifolia';
  /** Half-width of the blade, row by row from its base. */
  halfWidths: readonly number[];
  reach: number;
  step: number;
}

const STYLES: readonly LeafStyle[] = [
  { id: 'medallion', halfWidths: [1, 2, 3, 3, 3, 3, 2, 2, 1], reach: 2, step: 3 },
  { id: 'orbifolia', halfWidths: [2, 4, 5, 5, 5, 5, 4, 3, 2], reach: 3, step: 4 },
  { id: 'lancifolia', halfWidths: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1], reach: 2, step: 3 },
];

function bladeTone(style: LeafStyle, row: number, dx: number): PlantTone {
  const ax = Math.abs(dx);
  const edge = ax === style.halfWidths[row];
  switch (style.id) {
    case 'lancifolia':
      return dx === 0 || (row % 3 === 1 && ax === 1)
        ? 'leafDeep'
        : edge && row < 3
          ? 'leafAccent'
          : 'leaf';
    case 'orbifolia':
      return dx === 0 || edge ? 'leafDark' : row % 2 ? 'leafPale' : 'leaf';
    case 'medallion':
      return dx === 0
        ? 'leafDeep'
        : edge && row < 4
          ? 'leafAccent'
          : (row + ax) % 2
            ? 'leafLight'
            : 'leaf';
  }
}

export const calathea: Species = {
  id: 'calathea',
  hanging: false,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const add = plan.at;
    const style = choose(r, STYLES);

    for (let k = 0; k * 10 < MAX_GROWTH_DAYS; k++) {
      const d0 = k * 10;
      const side = k % 2 ? 1 : -1;
      const tx = CX + side * (style.reach + (k % 3) * style.step + Math.floor(r() * 3));
      const ty = T - 10 - Math.floor(k * 2.6) - Math.floor(r() * 3);

      const petiole = line(CX + side * (k % 3), T - 1, tx, ty);
      petiole.forEach(([x, y], i) =>
        add(d0 + Math.floor((i * 4) / petiole.length), x, y, 'leafDark'),
      );

      const blade: [number, number, PlantTone][] = [];
      style.halfWidths.forEach((half, row) => {
        for (let dx = -half; dx <= half; dx++) {
          // The blade leans outwards as it rises.
          blade.push([
            tx + dx + side * Math.floor(row / 3),
            ty - 1 - row,
            bladeTone(style, row, dx),
          ]);
        }
      });
      blade.forEach(([x, y, tone], i) =>
        add(d0 + 4 + Math.floor((i * 6) / blade.length), x, y, tone),
      );
    }

    return { plan: plan.build(), variety: style.id };
  },
};
