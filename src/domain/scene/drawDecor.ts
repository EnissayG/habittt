import { sin } from '../plant/trig';
import { SceneCanvas, type SceneImage, type SceneTone } from './sceneImage';

// The pictures of the room and what hangs from its ceiling: the paintings,
// the scroll and the paper lantern. The furniture of the meditation corner
// is in drawCorner.ts.
//
// Everything is drawn at the scale of the plants: one cell here is one cell
// of a plant. Like the window, these images hold symbolic tones only; the UI
// theme gives the colors.

export const PAINTING_SIZE = { width: 40, height: 30 } as const;
export const SCROLL_SIZE = { width: 30, height: 46 } as const;
/** The paper lantern, without its cord. */
export const LANTERN_SIZE = { width: 21, height: 16 } as const;

/** Dawn over misty ridges, dusk over the sea, and a bonsai print. */
export const PAINTINGS = ['peaks', 'sea', 'bonsai'] as const;
export type Painting = (typeof PAINTINGS)[number];

/** Width of the frame on each side: the canvas starts inside it. */
const FRAME = 3;

/** A framed picture for the wall. */
export function drawPainting(painting: Painting): SceneImage {
  const { width, height } = PAINTING_SIZE;
  const c = new SceneCanvas(width, height);
  // The frame: a dark outline, then a gilded moulding two pixels wide, lit
  // from the top left and shaded at the bottom right (each rectangle leaves
  // the top and left edges of the one before).
  c.fill(0, 0, width, height, 'frameDark');
  c.fill(1, 1, width - 2, height - 2, 'frameLight');
  c.fill(2, 2, width - 3, height - 3, 'frame');
  c.fill(3, 3, width - 5, height - 5, 'frameShade');
  const w = width - FRAME * 2;
  const h = height - FRAME * 2;
  /** Paints inside the frame, in canvas coordinates, cut at its edges. */
  const paint = (x: number, y: number, pw: number, ph: number, tone: SceneTone) => {
    const left = Math.max(0, x);
    const top = Math.max(0, y);
    const right = Math.min(w, x + pw);
    const bottom = Math.min(h, y + ph);
    if (right > left && bottom > top) {
      c.fill(FRAME + left, FRAME + top, right - left, bottom - top, tone);
    }
  };
  if (painting === 'peaks') paintPeaks(paint, w, h);
  else if (painting === 'sea') paintSea(paint, w, h);
  else paintBonsai(paint, w, h);
  return c.toImage();
}

type Paint = (x: number, y: number, w: number, h: number, tone: SceneTone) => void;

/** A disc of the given radius, row by row (whole pixels, no trigonometry). */
function disc(paint: Paint, cx: number, cy: number, radius: number, tone: SceneTone) {
  for (let dy = -radius; dy <= radius; dy++) {
    const half = Math.floor(Math.sqrt(radius * radius - dy * dy + radius * 0.8));
    paint(cx - half, cy + dy, half * 2 + 1, 1, tone);
  }
}

/** The summits of the farthest ridge: [column, height, half-width at the foot]. */
const SUMMITS = [
  [8, 19, 9],
  [20, 15, 7],
  [31, 17, 8],
] as const;

/** Height of the farthest ridge at column x: the tallest of its summits. */
function summitHeight(x: number): number {
  let top = 10;
  for (const [cx, height, run] of SUMMITS) {
    top = Math.max(top, Math.round(height - (Math.abs(x - cx) * (height - 8)) / run));
  }
  return top;
}

/**
 * Dawn in the mountains: a pale sky, the sun coming up behind snowy summits,
 * three rolling ridges that get darker towards the viewer and a few pines in
 * front.
 */
function paintPeaks(paint: Paint, w: number, h: number) {
  paint(0, 0, w, 5, 'paintDawn0');
  paint(0, 5, w, 5, 'paintDawn1');
  paint(0, 10, w, h - 10, 'paintDawn2');
  // A row of the next tint, one pixel out of two, softens each change.
  for (let x = 0; x < w; x += 2) {
    paint(x, 4, 1, 1, 'paintDawn1');
    paint(x + 1, 9, 1, 1, 'paintDawn2');
  }
  disc(paint, 26, 10, 3, 'sunCore');

  for (let x = 0; x < w; x++) {
    const top = summitHeight(x);
    paint(x, h - top, 1, top, 'paintRidge0');
    // Snow on the summits: two rows at the tip, one beside it.
    for (const [cx, height] of SUMMITS) {
      const away = Math.abs(x - cx);
      if (away <= 2 && top >= height - 2) paint(x, h - top, 1, away <= 1 ? 2 : 1, 'snow');
    }
  }
  const rolling: [SceneTone, (x: number) => number][] = [
    ['paintRidge1', (x) => 8 + Math.round(2.5 * sin(x / 4 + 1) + 1.5 * sin(x / 2.3))],
    ['paintRidge2', (x) => 5 + Math.round(2 * sin(x / 5 + 3) + sin(x / 2 + 1))],
    ['paintRidge3', (x) => 3 + Math.round(1.5 * sin(x / 6 + 2))],
  ];
  for (const [tone, height] of rolling) {
    for (let x = 0; x < w; x++) paint(x, h - height(x), 1, height(x), tone);
  }
  // Pines on the nearest slope: a pointed crown, wider towards the ground.
  const nearest = rolling[2]![1];
  for (const [x, size] of [
    [3, 5],
    [7, 7],
    [11, 4],
    [25, 5],
    [29, 7],
    [32, 5],
  ] as const) {
    const foot = h - nearest(x);
    for (let row = 0; row < size; row++) {
      const half = Math.floor(row / 2);
      paint(x - half, foot - size + row, half * 2 + 1, 1, 'paintPine');
    }
  }
}

/**
 * Dusk over the sea: the sun half set, its light broken on the water, a
 * headland with a lighthouse and a sail on the horizon.
 */
function paintSea(paint: Paint, w: number, h: number) {
  const horizon = 14;
  const sky: SceneTone[] = ['paintDusk0', 'paintDusk1', 'paintDusk2', 'paintDusk3', 'paintDusk4'];
  const bands = [0, 3, 6, 9, 12, horizon];
  sky.forEach((tone, i) => {
    paint(0, bands[i]!, w, bands[i + 1]! - bands[i]!, tone);
    // The next tint starts one pixel out of two, on the row above.
    if (i > 0) for (let x = i % 2; x < w; x += 2) paint(x, bands[i]! - 1, 1, 1, tone);
  });
  // Two long clouds catching the last light.
  paint(9, 3, 11, 1, 'paintCloud');
  paint(12, 4, 6, 1, 'paintCloud');
  paint(22, 7, 9, 1, 'paintCloud');
  paint(25, 6, 4, 1, 'paintCloud');

  const sunX = 20;
  disc(paint, sunX, horizon, 4, 'eveningSun');
  disc(paint, sunX, horizon, 2, 'sunCore');

  paint(0, horizon, w, 3, 'paintSea0');
  paint(0, horizon + 3, w, 3, 'paintSea1');
  paint(0, horizon + 6, w, h - horizon - 6, 'paintSea2');
  // The sun on the water: short strokes, wider and sparser towards the viewer.
  const glints: [number, number, number, SceneTone][] = [
    [-4, 0, 9, 'eveningSun'],
    [-3, 1, 7, 'paintGlint'],
    [-5, 2, 4, 'paintGlint'],
    [1, 2, 4, 'paintGlint'],
    [-2, 3, 6, 'paintGlint'],
    [-6, 4, 3, 'paintGlintDeep'],
    [0, 4, 5, 'paintGlint'],
    [-4, 5, 5, 'paintGlintDeep'],
    [3, 6, 4, 'paintGlintDeep'],
    [-7, 7, 4, 'paintGlintDeep'],
    [-1, 8, 3, 'paintGlintDeep'],
    [5, 9, 3, 'paintGlintDeep'],
  ];
  for (const [dx, dy, length, tone] of glints) paint(sunX + dx, horizon + dy, length, 1, tone);

  // The headland, on the left, and its lighthouse.
  for (let x = 0; x < 11; x++) {
    const top = Math.max(1, 5 - Math.floor((x * x) / 18));
    paint(x, horizon - top + 1, 1, top, 'paintLand');
  }
  paint(3, horizon - 9, 1, 5, 'paintSail');
  paint(3, horizon - 10, 1, 1, 'sunCore');
  paint(2, horizon - 5, 3, 1, 'paintLand');
  // A sail, far away.
  paint(29, horizon - 3, 1, 1, 'paintSail');
  paint(29, horizon - 2, 2, 1, 'paintSail');
  paint(29, horizon - 1, 3, 1, 'paintSail');
  paint(28, horizon, 5, 1, 'paintLand');
}

/**
 * A print on paper: the bonsai, the plant of the app, in front of a pale
 * sun, with the printer's seal in the corner.
 */
function paintBonsai(paint: Paint, w: number, h: number) {
  paint(0, 0, w, h, 'paintPaper');
  disc(paint, 22, 10, 7, 'paintDisc');
  // The ground, a single stroke.
  paint(4, h - 3, w - 8, 1, 'paintInk');
  // The tray, on two feet.
  paint(9, h - 6, 13, 1, 'paintPotLight');
  paint(10, h - 5, 11, 2, 'paintPot');
  paint(18, h - 5, 3, 2, 'paintPotShade');
  paint(11, h - 3, 2, 1, 'paintPotShade');
  paint(18, h - 3, 2, 1, 'paintPotShade');
  // The trunk leans to the right, then one branch goes each way.
  paint(14, h - 9, 3, 3, 'trunk');
  paint(15, h - 12, 3, 3, 'trunk');
  paint(16, h - 14, 2, 2, 'trunk');
  paint(14, h - 9, 1, 3, 'paintBark');
  paint(15, h - 12, 1, 3, 'paintBark');
  paint(10, h - 12, 5, 1, 'trunk');
  paint(9, h - 13, 2, 1, 'trunk');
  paint(18, h - 13, 5, 1, 'trunk');
  paint(22, h - 14, 2, 1, 'trunk');
  // Three pads of foliage, lit from above.
  const pads: [number, number, number][] = [
    [18, 6, 6],
    [8, 9, 4],
    [25, 8, 4],
  ];
  for (const [cx, cy, half] of pads) {
    paint(cx - half + 2, cy - 2, half * 2 - 3, 1, 'paintLeafLight');
    paint(cx - half + 1, cy - 1, half * 2 - 1, 1, 'paintLeafLight');
    paint(cx - half, cy, half * 2 + 1, 1, 'paintLeaf');
    paint(cx - half, cy + 1, half * 2 + 1, 1, 'paintLeaf');
    paint(cx - half + 1, cy + 2, half * 2 - 1, 1, 'paintLeafDark');
    paint(cx + 1, cy, half - 1, 1, 'paintLeafLight');
    paint(cx - half + 1, cy + 1, 2, 1, 'paintLeafDark');
  }
  // The seal.
  paint(w - 5, h - 7, 2, 3, 'paintSeal');
}

/**
 * A hanging scroll: an ensō, the circle drawn in one breath, on paper
 * between two wooden rods. It hangs on the wall of the meditation corner.
 */
export function drawScroll(): SceneImage {
  const { width, height } = SCROLL_SIZE;
  const c = new SceneCanvas(width, height);
  const middle = Math.floor(width / 2);
  // The cord and the nail.
  c.fill(middle, 0, 1, 1, 'frameDark');
  for (let i = 1; i <= 3; i++) {
    c.fill(middle - i * 3, i, 3, 1, 'frameShade');
    c.fill(middle + 1 + (i - 1) * 3, i, 3, 1, 'frameShade');
  }
  // The rods, wider than the paper, and the paper between them.
  c.fill(0, 4, width, 2, 'frameDark');
  c.fill(0, height - 2, width, 2, 'frameDark');
  c.fill(2, 6, width - 4, height - 8, 'paintPaper');
  c.fill(width - 3, 6, 1, height - 8, 'paperShade');

  // The circle: thick where the brush pressed (bottom left), thin where it
  // lifted, open at the top right.
  const cx = middle;
  const cy = 6 + Math.floor((height - 8) / 2) - 1;
  const outer = 10;
  for (let dy = -outer; dy <= outer; dy++) {
    for (let dx = -outer; dx <= outer; dx++) {
      const d2 = dx * dx + dy * dy;
      // Thickness from 1 (top right) to 4 (bottom left).
      const weight = (dy - dx + 2 * outer) / (4 * outer);
      const inner = outer - 1 - Math.round(weight * 3);
      if (d2 > outer * outer + outer || d2 < inner * inner + inner) continue;
      // The gap where the stroke starts and ends.
      if (dx > 3 && dy < -4 && dx - 3 < -dy - 2) continue;
      c.fill(cx + dx, cy + dy, 1, 1, weight > 0.55 ? 'inkDeep' : 'ink');
    }
  }
  // The seal.
  c.fill(width - 8, height - 9, 3, 3, 'paintSeal');
  return c.toImage();
}

/** Width of the lantern, row by row: a paper ball, flattened at both ends. */
const LANTERN_ROWS = [5, 11, 15, 19, 21, 21, 21, 21, 21, 21, 21, 19, 15, 11, 5, 3];

/**
 * A paper lantern hanging from the ceiling at the end of a cord `cord` rows
 * long: the room's ceiling is the top of the image.
 */
export function drawLantern(cord: number): SceneImage {
  const { width, height } = LANTERN_SIZE;
  const rope = Math.max(0, Math.round(cord));
  const c = new SceneCanvas(width, rope + height);
  const middle = Math.floor(width / 2);
  c.fill(middle, 0, 1, rope, 'frameDark');
  LANTERN_ROWS.forEach((w, i) => {
    const y = rope + i;
    const left = middle - Math.floor(w / 2);
    // The paper, with a rib every third row and a lighter side, lit from within.
    c.fill(left, y, w, 1, i % 3 === 1 ? 'lampShade' : 'lampLight');
    if (w > 9) c.fill(left + w - 3, y, 3, 1, 'lampShade');
  });
  c.fill(middle - 2, rope, 5, 1, 'frameDark');
  c.fill(middle - 1, rope + height - 1, 3, 1, 'frameDark');
  return c.toImage();
}
