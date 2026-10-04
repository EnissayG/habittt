import { MAX_GROWTH_DAYS, type PlantTone } from '../grid';
import { GrowthPlanBuilder, type GrowthPlan } from '../growthPlan';
import { line } from '../raster';
import type { SpeciesContext } from '../species';

// Shared by large-leaf species: one leaf every 10 days, alternating sides,
// each rising a little higher. Days 0-3 of a cycle grow the petiole,
// days 4-9 unfurl the blade.

const DAYS_PER_LEAF = 10;
const PETIOLE_DAYS = 4;
const BLADE_DAYS = 6;

export interface BigLeafStyle {
  /** Half-width of the blade, row by row from its base. */
  halfWidths: readonly number[];
  /** Horizontal distance of the first leaves from the stem. */
  reach: number;
  /** Extra distance added in a 3-leaf cycle. */
  step: number;
  /** Tone of the blade pixel at (row, dx); null leaves a hole. */
  bladeTone(leafIndex: number, row: number, dx: number, side: number): PlantTone | null;
}

export function buildBigLeafPlant(style: BigLeafStyle, ctx: SpeciesContext): GrowthPlan {
  const { random, anchorX, rimY } = ctx;
  const plan = new GrowthPlanBuilder();

  for (let leaf = 0; leaf * DAYS_PER_LEAF < MAX_GROWTH_DAYS; leaf++) {
    const firstDay = leaf * DAYS_PER_LEAF + 1;
    const side = leaf % 2 ? 1 : -1;
    const tipX =
      anchorX + side * (style.reach + (leaf % 3) * style.step + Math.floor(random() * 3));
    const tipY = rimY - 10 - Math.floor(leaf * 2.6) - Math.floor(random() * 3);

    const petiole = line(anchorX + side * (leaf % 3), rimY - 1, tipX, tipY);
    petiole.forEach(([x, y], i) => {
      plan.add(firstDay + Math.floor((i * PETIOLE_DAYS) / petiole.length), x, y, 'leafDark');
    });

    const blade: { x: number; y: number; tone: PlantTone }[] = [];
    style.halfWidths.forEach((half, row) => {
      for (let dx = -half; dx <= half; dx++) {
        const tone = style.bladeTone(leaf, row, dx, side);
        if (tone === null) continue;
        // The blade leans outwards as it rises.
        blade.push({ x: tipX + dx + side * Math.floor(row / 3), y: tipY - 1 - row, tone });
      }
    });
    blade.forEach(({ x, y, tone }, i) => {
      plan.add(firstDay + PETIOLE_DAYS + Math.floor((i * BLADE_DAYS) / blade.length), x, y, tone);
    });
  }

  return plan.build();
}
