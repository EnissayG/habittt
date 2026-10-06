import { PLANT_GRID } from '../plant/grid';
import { sin } from '../plant/trig';
import { SceneCanvas, type SceneImage } from './sceneImage';
import type { WindowView } from './windowView';

// The shelf window, ported from drawWindow() in the mockup
// (docs/prototypes/maquette-habittt.html). As wide as two plants.
//
// Ready to be animated later: the picture is a stack of layers, each a
// function of (view, t). Today t is always 0; animating means calling
// drawWindow with a moving t (clouds drifting, snow falling, stars
// twinkling) without touching the frame or the curtains.

export const WINDOW_SIZE = { width: PLANT_GRID.width * 2, height: 46 } as const;

/** The glass area inside the frame. */
export const GLASS = { x: 13, y: 7, width: 70, height: 30 } as const;

/** How strongly the glass reflects light, per view (0 to 1). */
const GLARE: Record<WindowView, number> = { day: 0.2, evening: 0.1, night: 0.06, winter: 0.16 };

/** 4×4 ordered dithering matrix, for the sky gradient. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const STARS = [
  [5, 4],
  [12, 2],
  [19, 9],
  [27, 5],
  [34, 12],
  [41, 3],
  [47, 8],
  [65, 13],
  [9, 13],
  [30, 16],
];

const SNOWFLAKES = [
  [3, 9],
  [10, 15],
  [18, 6],
  [25, 18],
  [33, 11],
  [44, 5],
  [52, 16],
  [61, 10],
  [67, 19],
  [6, 22],
  [38, 21],
  [57, 23],
];

const TREES = [
  [7, 7],
  [15, 5],
  [60, 6],
  [66, 8],
];

type Layer = (c: SceneCanvas, view: WindowView, t: number) => void;

const { x: gx, y: gy, width: gw, height: gh } = GLASS;
const ground = gy + gh;

const frame: Layer = (c) => {
  c.fill(9, 3, 78, 38, 'frameDark');
  c.fill(10, 4, 76, 36, 'frame');
  c.fill(10, 4, 76, 1, 'frameLight');
  c.fill(10, 4, 1, 36, 'frameLight');
  c.fill(85, 5, 1, 35, 'frameShade');
  c.fill(10, 39, 76, 1, 'frameShade');
  c.fill(12, 6, 72, 32, 'frameDark');
};

const sky: Layer = (c) => {
  const bands = ['sky0', 'sky1', 'sky2', 'sky3'] as const;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const f = (y / (gh - 1)) * 3;
      const b = Math.min(2, Math.floor(f));
      const band = f - b > BAYER[y % 4]![x % 4]! / 16 ? b + 1 : b;
      c.fill(gx + x, gy + y, 1, 1, bands[band]!);
    }
  }
};

const celestial: Layer = (c, view) => {
  if (view === 'day') {
    c.fill(gx + 58, gy + 3, 5, 5, 'sun');
    c.fill(gx + 59, gy + 2, 3, 7, 'sun');
    c.fill(gx + 59, gy + 4, 3, 3, 'sunCore');
  }
  if (view === 'winter') {
    c.fill(gx + 56, gy + 4, 5, 5, 'paleSun');
    c.fill(gx + 57, gy + 3, 3, 7, 'paleSun');
  }
  if (view === 'evening') {
    c.fill(gx + 20, ground - 13, 7, 5, 'eveningSun');
    c.fill(gx + 21, ground - 14, 5, 1, 'eveningSun');
    c.fill(gx + 22, ground - 12, 3, 3, 'sunCore');
  }
  if (view === 'night') {
    c.fill(gx + 56, gy + 3, 5, 6, 'moon');
    c.fill(gx + 57, gy + 2, 3, 8, 'moon');
    c.fill(gx + 58, gy + 3, 3, 5, 'sky0'); // the crescent's bite
    for (const [x, y] of STARS) c.fill(gx + x!, gy + y!, 1, 1, 'star');
  }
};

/** Clouds will drift with t once animated. */
const clouds: Layer = (c, view) => {
  const cloud = (x: number, y: number, w: number) => {
    c.fill(gx + x + 2, gy + y, w - 5, 1, 'cloud');
    c.fill(gx + x, gy + y + 1, w, 2, 'cloud');
    c.fill(gx + x + 1, gy + y + 3, w - 3, 1, 'cloudShade');
  };
  if (view !== 'night') {
    cloud(6, 5, 12);
    cloud(34, 9, 9);
  } else cloud(30, 7, 11);
};

const hills: Layer = (c) => {
  for (let x = 0; x < gw; x++) {
    const far = Math.round(9 + 3 * sin(x / 9 + 1) + 2 * sin(x / 4));
    const near = Math.round(5 + 2 * sin(x / 6 + 3) + 1.5 * sin(x / 2.5));
    c.fill(gx + x, ground - far, 1, far, 'hillFar');
    c.fill(gx + x, ground - near, 1, near, 'hillNear');
  }
};

const house: Layer = (c) => {
  const hx = gx + 40;
  const hy = ground - 11;
  c.fill(hx, hy + 3, 8, 5, 'houseWall');
  c.fill(hx - 1, hy + 2, 10, 1, 'roof');
  c.fill(hx, hy + 1, 8, 1, 'roof');
  c.fill(hx + 2, hy, 4, 1, 'roof');
  c.fill(hx + 2, hy + 5, 2, 2, 'windowLit');
  c.fill(hx + 5, hy + 5, 2, 3, 'trunk'); // the door
};

const trees: Layer = (c, view) => {
  for (const [dx, height] of TREES) {
    const tx = gx + dx!;
    const base = ground - height! + 2;
    c.fill(tx, base - 3, 1, 4, 'trunk');
    if (view === 'winter') {
      c.fill(tx - 1, base - 4, 1, 1, 'trunk');
      c.fill(tx + 1, base - 5, 1, 2, 'trunk');
      c.fill(tx - 2, base - 5, 1, 1, 'trunk');
      c.fill(tx - 1, base - 6, 3, 1, 'snow');
    } else {
      c.fill(tx - 2, base - 7, 5, 4, 'treeDark');
      c.fill(tx - 1, base - 8, 3, 1, 'treeDark');
      c.fill(tx - 2, base - 7, 2, 2, 'treeLight');
    }
  }
};

/** Snow will fall with t once animated. */
const snow: Layer = (c, view) => {
  if (view !== 'winter') return;
  for (const [x, y] of SNOWFLAKES) c.fill(gx + x!, gy + y!, 1, 1, 'snow');
};

const glare: Layer = (c, view) => {
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const k = (x + y) % 31;
      if (k < 3 || k === 6)
        c.blend(gx + x, gy + y, 1, 1, { kind: 'tone', tone: 'glare' }, GLARE[view]);
    }
  }
};

const mullions: Layer = (c) => {
  c.fill(gx + 34, gy, 2, gh, 'frame');
  c.fill(gx + 36, gy, 1, gh, 'frameShade');
  c.fill(gx + 33, gy, 1, gh, 'frameLight');
  c.fill(gx + 16, gy, 1, gh, 'frame');
  c.fill(gx + 53, gy, 1, gh, 'frame');
  c.fill(gx, gy + 10, gw, 1, 'frame');
  c.fill(gx, gy + 11, gw, 1, 'frameShade');
};

const curtains: Layer = (c) => {
  c.fill(3, 1, 90, 1, 'frameDark'); // rod
  c.fill(2, 0, 2, 3, 'frameDark');
  c.fill(92, 0, 2, 3, 'frameDark');
  for (const [from, to] of [
    [4, 14],
    [78, 92],
  ] as const) {
    for (let x = from; x < to; x++) {
      const k = (x - from) % 4;
      c.fill(x, 2, 1, 40, k === 0 ? 'curtainShade' : k === 2 ? 'curtainLight' : 'curtain');
    }
    c.fill(from, 41, to - from, 1, 'curtainShade');
  }
};

const sill: Layer = (c) => {
  c.fill(6, 41, 84, 2, 'frameLight');
  c.fill(6, 43, 84, 1, 'frameShade');
  c.blend(8, 44, 80, 1, { kind: 'tone', tone: 'shadow' }, 0.12);
};

/** Bottom to top. Only clouds, celestial and snow will depend on t. */
const LAYERS: readonly Layer[] = [
  frame,
  sky,
  celestial,
  clouds,
  hills,
  house,
  trees,
  snow,
  glare,
  mullions,
  curtains,
  sill,
];

export function drawWindow(view: WindowView, t = 0): SceneImage {
  const canvas = new SceneCanvas(WINDOW_SIZE.width, WINDOW_SIZE.height);
  for (const layer of LAYERS) layer(canvas, view, t);
  return canvas.toImage();
}
