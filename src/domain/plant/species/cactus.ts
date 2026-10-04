import { MAX_GROWTH_DAYS, type PlantTone } from '../grid';
import { GrowthPlanBuilder } from '../growthPlan';
import type { Random } from '../random';
import type { Species, SpeciesContext } from '../species';
import { choose, lanes, type AddStroke } from './shared';

// Three very different cacti, picked by variety:
// - saguaro: a trunk, two arms, then flowers on the tops;
// - organ-pipe: three or four columns growing at their own pace, then flowers;
// - prickly-pear: flat pads stacked on each other, flowering when mature.

const N = MAX_GROWTH_DAYS;
const COLUMN: readonly PlantTone[] = ['succulentDark', 'succulent', 'succulentLight'];

const VARIETIES = ['saguaro', 'saguaro', 'organ-pipe', 'prickly-pear', 'prickly-pear'] as const;

/** One row of a 3-wide column, with spines on alternate sides. */
function columnRow(add: AddStroke, d: number, cx: number, y: number, h: number) {
  COLUMN.forEach((tone, i) => {
    const spine = (i === 0 && h % 4 === 1) || (i === 2 && h % 4 === 3);
    add(d, cx - 1 + i, y, spine ? 'spine' : tone);
  });
}

function saguaro(r: Random, { anchorX: CX, rimY: T }: SpeciesContext, add: AddStroke) {
  const row3 = (d: number, cx: number, h: number) => columnRow(add, d, cx, T - 1 - h, h);
  const trunk = (d: number, h: number) => {
    add(d, CX - 1, T - 1 - h, 'succulent');
    add(d, CX, T - 1 - h, 'succulentLight');
    add(d, CX + 1, T - 1 - h, 'succulent');
    if (h > 0) {
      add(d, CX - 2, T - h, h % 4 === 1 ? 'spine' : 'succulentDark');
      add(d, CX + 2, T - h, h % 4 === 3 ? 'spine' : 'succulentDark');
    }
  };
  const a = 6 + Math.floor(r() * 10);
  const b = 11 + Math.floor(r() * 10);
  let q = 0;
  let flowers = 0;
  const tops = [CX, CX - 5, CX + 5];

  for (let d = 0; d < N; d++) {
    if (d < 30) trunk(d, d);
    else if (d < 33) {
      for (let j = 0; j < 3; j++) add(d, CX - 3 - (d - 30), T - 1 - a - j, COLUMN[2 - j]!);
    } else if (d < 50) row3(d, CX - 5, a + 3 + (d - 33));
    else if (d < 53) {
      for (let j = 0; j < 3; j++) add(d, CX + 3 + (d - 50), T - 1 - b - j, COLUMN[2 - j]!);
    } else if (d < 65) row3(d, CX + 5, b + 3 + (d - 53));
    else if (d < 75) trunk(d, 30 + d - 65);
    else if ((d - 75) % 5 === 0) {
      const t = flowers % 3;
      const o = Math.floor(flowers / 3) - 1;
      flowers++;
      const ty = t === 0 ? T - 1 - 39 : t === 1 ? T - 1 - (a + 19) : T - 1 - (b + 14);
      add(d, tops[t]! + o, ty - 1, 'flower');
      if (o === 0) add(d, tops[t]!, ty - 2, 'flower');
    } else {
      if (q < 8) row3(d, CX - 5, q);
      else if (q < 16) row3(d, CX + 5, q - 8);
      else add(d, CX - 1 + Math.floor(r() * 3), T - 2 - Math.floor(r() * 36), 'spine');
      q++;
    }
  }
}

const FLOWER_OFFSETS = [0, -1, 1, 0];

function organPipe(r: Random, { anchorX: CX, rimY: T }: SpeciesContext, add: AddStroke) {
  const count = 3 + Math.floor(r() * 2);
  const xs: number[] = [];
  const heights = new Array<number>(count).fill(0);
  for (let i = 0; i < count; i++) xs.push(Math.round(CX + (i - (count - 1) / 2) * 5));
  const next = lanes(r, count, () => 40, 4);

  for (let d = 0; d < N; d++) {
    if (d >= 108) {
      const i = (d - 108) % count;
      const o = Math.floor((d - 108) / count);
      add(
        d,
        xs[i]! + (FLOWER_OFFSETS[o] as number),
        T - 2 - heights[i]! + (o === 3 ? -1 : 0),
        'flower',
      );
      continue;
    }
    const i = next();
    const h = heights[i]!++;
    columnRow(add, d, xs[i]!, T - 1 - h, h);
  }
}

const PAD_HALF_WIDTHS = [1, 2, 3, 3, 3, 3, 3, 2, 1];

interface Pad {
  x: number;
  y: number;
  kids: number;
  first?: number;
}

function pricklyPear(
  r: Random,
  { anchorX: CX, rimY: T, width: W }: SpeciesContext,
  add: AddStroke,
) {
  const pads: Pad[] = [{ x: CX, y: T - 1, kids: 0 }];
  for (let k = 0; k * 10 < N; k++) {
    let pad: Pad;
    if (k === 0) pad = pads[0]!;
    else {
      const open = pads.filter((p) => p.kids < 2 && p.y - 7 > 12);
      const parent = open[Math.floor(r() * open.length)] ?? pads[pads.length - 1]!;
      const side = parent.kids === 0 ? (r() < 0.5 ? -1 : 1) : -parent.first!;
      if (parent.kids === 0) parent.first = side;
      parent.kids++;
      pad = {
        x: Math.max(5, Math.min(W - 6, parent.x + side * (3 + Math.floor(r() * 2)))),
        y: parent.y - 7,
        kids: 0,
      };
      pads.push(pad);
    }

    const cells: [number, number, PlantTone][] = [];
    PAD_HALF_WIDTHS.forEach((half, i) => {
      for (let dx = -half; dx <= half; dx++) {
        const tone: PlantTone =
          Math.abs(dx) === half
            ? 'succulentDark'
            : i % 3 === 1 && dx % 2 === 0
              ? 'spine'
              : dx < 0
                ? 'succulentLight'
                : 'succulent';
        cells.push([pad.x + dx, pad.y - i, tone]);
      }
    });
    cells.forEach(([x, y, tone], i) =>
      add(k * 10 + Math.floor((i * 9) / cells.length), x, y, tone),
    );
    const top = pad.y - PAD_HALF_WIDTHS.length;
    add(k * 10 + 9, pad.x, top, k >= 6 ? 'flower' : 'succulentLight');
    if (k >= 6) add(k * 10 + 9, pad.x + 1, top, 'flower');
  }
}

export const cactus: Species = {
  id: 'cactus',
  hanging: false,
  build(ctx) {
    const plan = new GrowthPlanBuilder();
    const variety = choose(ctx.random, VARIETIES);
    const draw =
      variety === 'saguaro' ? saguaro : variety === 'organ-pipe' ? organPipe : pricklyPear;
    draw(ctx.random, ctx, plan.at);
    return { plan: plan.build(), variety };
  },
};
