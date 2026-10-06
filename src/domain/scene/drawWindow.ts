import { PLANT_GRID } from '../plant/grid';
import { sin } from '../plant/trig';
import { SceneCanvas, type SceneImage, type SceneTone } from './sceneImage';
import type { WindowView } from './windowView';

// The shelf window, ported from drawWindow() in the mockup
// (docs/prototypes/maquette-habittt.html). As wide as two plants.
//
// Animated: the picture is a stack of layers, each a function of (view, t),
// t in seconds. Only the view through the glass moves, in whole pixels; the
// frame and the curtains never change. t = 0 is the still window.
//
// What moves (the mockup's animated drawWindow(cv, t) is the reference):
// - day and evening: clouds cross the sky, smoke rises from the chimney,
//   the sun's rays breathe;
// - night: each star has its own rhythm and several levels of brightness
//   (it never just appears or disappears), a shooting star passes now and
//   then, the house's window flickers;
// - winter: each snowflake falls at its own speed, swaying.

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

/** Each star: x, y, phase and period (in beats) of its own rhythm. */
export const STARS = [
  [5, 4, 0, 23],
  [12, 2, 7, 31],
  [19, 9, 3, 17],
  [27, 5, 11, 29],
  [31, 13, 5, 37],
  [41, 3, 2, 19],
  [47, 8, 9, 41],
  [62, 17, 4, 27],
  [9, 13, 13, 33],
  [30, 16, 1, 21],
  [52, 15, 6, 25],
  [22, 3, 10, 35],
] as const;

const SNOWFLAKE_COUNT = 16;

const TREES = [
  [7, 7],
  [15, 5],
  [60, 6],
  [66, 8],
];

type Layer = (c: SceneCanvas, view: WindowView, t: number) => void;

const { x: gx, y: gy, width: gw, height: gh } = GLASS;
const ground = gy + gh;

/** Pixels per second. Slow: it is a window, not a screen saver. */
const CLOUD_SPEEDS = [0.7, 0.45] as const;
/** Beats per second: the rhythm of everything that changes step by step. */
export const BEATS_PER_SECOND = 6;
/** A shooting star crosses once per this many beats (15 s), for 7 beats. */
const METEOR_PERIOD = 90;
const METEOR_BEATS = 7;

const beatOf = (t: number) => Math.floor(t * BEATS_PER_SECOND);

/** Opaque rectangle clipped to the glass (things moving behind the frame). */
function fillGlass(c: SceneCanvas, x: number, y: number, w: number, h: number, tone: SceneTone) {
  const left = Math.max(gx, x);
  const top = Math.max(gy, y);
  const right = Math.min(gx + gw, x + w);
  const bottom = Math.min(gy + gh, y + h);
  if (right > left && bottom > top) c.fill(left, top, right - left, bottom - top, tone);
}

/** a mod n, always in [0, n). */
const wrap = (a: number, n: number) => ((a % n) + n) % n;

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

/** Brightness of a star on a given beat: it changes, it never vanishes. */
function starTone(beat: number, phase: number, period: number): SceneTone {
  const k = (beat + phase * 3) % period;
  if (k < 2) return 'starBright';
  if (k < 5 || k > period - 3) return 'star';
  return k % 7 < 5 ? 'starDim' : 'starFaint';
}

const celestial: Layer = (c, view, t) => {
  const beat = beatOf(t);
  if (view === 'day') {
    c.fill(gx + 58, gy + 3, 5, 5, 'sun');
    c.fill(gx + 59, gy + 2, 3, 7, 'sun');
    c.fill(gx + 59, gy + 4, 3, 3, 'sunCore');
    // Four rays that come and go, once a second.
    if (Math.floor(beat / 6) % 2 === 1) {
      c.fill(gx + 56, gy + 5, 1, 1, 'sun');
      c.fill(gx + 64, gy + 5, 1, 1, 'sun');
      c.fill(gx + 60, gy, 1, 1, 'sun');
      c.fill(gx + 60, gy + 10, 1, 1, 'sun');
    }
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
    for (const [x, y, phase, period] of STARS) {
      const tone = starTone(beat, phase, period);
      if (tone === 'starBright') {
        // At its brightest a star is a small cross.
        fillGlass(c, gx + x - 1, gy + y, 3, 1, 'starGlow');
        fillGlass(c, gx + x, gy + y - 1, 1, 3, 'starGlow');
      }
      c.fill(gx + x, gy + y, 1, 1, tone);
    }
    const k = beat % METEOR_PERIOD;
    if (beat > 0 && k < METEOR_BEATS) {
      const trail = ['starBright', 'starDim', 'starFaint', 'starFaint'] as const;
      trail.forEach((tone, i) =>
        fillGlass(c, gx + 10 + k * 3 - i * 2, gy + 2 + k - Math.floor(i * 0.7), 1, 1, tone),
      );
    }
    c.fill(gx + 56, gy + 3, 5, 6, 'moon');
    c.fill(gx + 57, gy + 2, 3, 8, 'moon');
    c.fill(gx + 58, gy + 3, 3, 5, 'sky0'); // the crescent's bite
  }
};

/** Clouds drift to the right and come back in from the left. */
const clouds: Layer = (c, view, t) => {
  const cloud = (x0: number, y: number, w: number, speed: number) => {
    const x = wrap(x0 + w + Math.floor(t * speed), gw + w) - w;
    fillGlass(c, gx + x + 2, gy + y, w - 5, 1, 'cloud');
    fillGlass(c, gx + x, gy + y + 1, w, 2, 'cloud');
    fillGlass(c, gx + x + 1, gy + y + 3, w - 3, 1, 'cloudShade');
  };
  if (view !== 'night') {
    cloud(6, 5, 12, CLOUD_SPEEDS[0]);
    cloud(34, 9, 9, CLOUD_SPEEDS[1]);
  } else cloud(30, 7, 11, CLOUD_SPEEDS[1]);
};

const hills: Layer = (c) => {
  for (let x = 0; x < gw; x++) {
    const far = Math.round(9 + 3 * sin(x / 9 + 1) + 2 * sin(x / 4));
    const near = Math.round(5 + 2 * sin(x / 6 + 3) + 1.5 * sin(x / 2.5));
    c.fill(gx + x, ground - far, 1, far, 'hillFar');
    c.fill(gx + x, ground - near, 1, near, 'hillNear');
  }
};

const house: Layer = (c, view, t) => {
  const hx = gx + 40;
  const hy = ground - 11;
  const beat = beatOf(t);
  c.fill(hx + 6, hy - 1, 1, 2, 'roof'); // the chimney
  // Four puffs of smoke rise one after the other, swaying and thinning out.
  for (let i = 0; i < 4; i++) {
    const k = (beat / 3 + i * 2.5) % 10;
    if (k >= 9) continue;
    const px = hx + 6 + Math.round(sin(k * 0.9 + i) * 1.2 + k * 0.3);
    fillGlass(c, px, hy - 2 - Math.floor(k), k < 3 ? 1 : 2, 1, 'smoke');
  }
  c.fill(hx, hy + 3, 8, 5, 'houseWall');
  c.fill(hx - 1, hy + 2, 10, 1, 'roof');
  c.fill(hx, hy + 1, 8, 1, 'roof');
  c.fill(hx + 2, hy, 4, 1, 'roof');
  // After dark the lamp inside flickers for a moment, every six seconds.
  const flicker = (view === 'night' || view === 'evening') && beat > 0 && beat % 37 < 2;
  c.fill(hx + 2, hy + 5, 2, 2, flicker ? 'windowGlow' : 'windowLit');
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

/** Snow: each flake falls at its own speed and sways from side to side. */
const snow: Layer = (c, view, t) => {
  if (view !== 'winter') return;
  const beat = beatOf(t);
  for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
    const speed = 0.35 + (i % 3) * 0.2; // rows per beat
    const y = Math.floor(i * 7 + beat * speed) % gh;
    const x = wrap(i * 13 + 5 + Math.round(sin((beat + i * 9) / 7) * 1.5), gw);
    c.fill(gx + x, gy + y, 1, 1, 'snow');
  }
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

/** Bottom to top. Only celestial, clouds, house and snow depend on t. */
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
