import { MAX_GROWTH_DAYS, type PlantTone } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import { line } from '../raster';
import type { Species } from '../species';
import { sin } from '../trig';
import { choose, type AddStroke } from './shared';

// A bonsai on a tray: the trunk (days 1-28), then the branches (29-42), then
// foliage pads that fill in from their center outwards (43-120). The style
// sets the trunk: upright (chokkan), winding (moyogi), slanting (shakan) or
// windswept (fukinagashi, all branches on one side).

const STYLES = ['chokkan', 'moyogi', 'moyogi', 'shakan', 'fukinagashi'] as const;

type Cell = [x: number, y: number, tone: PlantTone];

interface Pad {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

/** Spreads `cells` evenly over the day indexes [from, to). */
function spread(add: AddStroke, cells: readonly Cell[], from: number, to: number) {
  cells.forEach(([x, y, tone], i) =>
    add(from + Math.floor((i * (to - from)) / cells.length), x, y, tone),
  );
}

export const bonsai: Species = {
  id: 'bonsai',
  hanging: false,
  tray: true,
  build({ random: r, anchorX: CX, rimY: T }) {
    const plan = new GrowthPlanBuilder();
    const style = choose(r, STYLES);
    const windswept = style === 'fukinagashi';
    const dir = r() < 0.5 ? -1 : 1;
    const height = 20 + Math.floor(r() * 7);
    const lean =
      style === 'shakan'
        ? 0.45 + r() * 0.2
        : windswept
          ? 0.3 + r() * 0.15
          : style === 'moyogi'
            ? (r() - 0.5) * 0.3
            : 0;
    const amplitude = style === 'moyogi' ? 2.5 + r() * 2 : windswept ? 1 : 0;
    const frequency = 0.22 + r() * 0.12;
    const trunkX = (h: number) =>
      CX -
      Math.round(dir * lean * height * 0.35) +
      Math.round(dir * (lean * h + amplitude * sin(h * frequency)));

    const trunk: Cell[] = [];
    for (let h = 0; h < height; h++) {
      const w = h === 0 ? 2 : h < height * 0.35 ? 1 : 0;
      const x = trunkX(h);
      const right = h < height * 0.7 ? Math.max(w, 1) : w;
      for (let dx = -w; dx <= right; dx++)
        trunk.push([x + dx, T - 1 - h, dx > 0 ? 'barkDark' : 'bark']);
    }

    const limbs: Cell[] = [];
    const pads: Pad[] = [];
    const branchCount = 3 + Math.floor(r() * 3);
    for (let i = 0; i < branchCount; i++) {
      const h = Math.round(height * (0.38 + (0.5 * i) / branchCount));
      const side = windswept ? dir : (i % 2 ? 1 : -1) * dir;
      const length = Math.round((windswept ? 9 : 8) - i * (windswept ? 0.8 : 1.1) + r() * 2);
      const x0 = trunkX(h);
      const y0 = T - 1 - h;
      const endX = x0 + side * length;
      const endY = y0 - (windswept ? 0 : 1 + Math.floor(r() * 2));
      for (const [x, y] of line(x0 + side, y0, endX, endY)) limbs.push([x, y, 'bark']);
      pads.push({
        x: endX + (windswept ? side * 2 : 0),
        y: endY - 1,
        rx: Math.max(3, (windswept ? 6 : 5) - Math.floor(i / 2)),
        ry: 2,
      });
    }
    pads.push({
      x: trunkX(height - 1) + (windswept ? dir * 3 : 0),
      y: T - 1 - height,
      rx: windswept ? 5 : 4,
      ry: 3,
    });

    // Each pad's cells, ordered from the center out with a little jitter.
    const padCells = pads.map((pad) => {
      const cells: [...Cell, number][] = [];
      for (let dy = -pad.ry; dy <= pad.ry; dy++) {
        for (let dx = -pad.rx; dx <= pad.rx; dx++) {
          const q = (dx * dx) / (pad.rx * pad.rx + 0.5) + (dy * dy) / (pad.ry * pad.ry + 0.5);
          if (q > 1 || (dy === pad.ry && (dx + pad.x) % 3 === 0)) continue;
          const tone: PlantTone =
            dy < 0
              ? dy === -pad.ry || (dx + dy) % 3 === 0
                ? 'leafLight'
                : 'leaf'
              : dy === pad.ry
                ? 'leafDeep'
                : dx % 2
                  ? 'leafDark'
                  : 'leaf';
          cells.push([pad.x + dx, pad.y + dy, tone, q + r() * 0.35]);
        }
      }
      return cells.sort((a, b) => a[3] - b[3]);
    });

    // Pads fill in together: first cell of each pad, then the second, etc.
    const foliage: Cell[] = [];
    for (let i = 0; padCells.some((cells) => i < cells.length); i++) {
      for (const cells of padCells) {
        const cell = cells[i];
        if (cell) foliage.push([cell[0], cell[1], cell[2]]);
      }
    }

    spread(plan.at, trunk, 0, 28);
    spread(plan.at, limbs, 28, 42);
    spread(plan.at, foliage, 42, MAX_GROWTH_DAYS);

    return { plan: plan.build(), variety: style };
  },
};
