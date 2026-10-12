import { sin } from '../plant/trig';
import { SceneCanvas, type SceneImage } from './sceneImage';

// The meditation corner, the last wall of the room: a round cushion on a
// woven mat, a low table with a stone figure, a candle and incense whose
// smoke moves, a small wall shelf with books and a singing bowl, a vase of
// dried grasses. And, for every wall, the wallpaper and the moulding that
// dress the bare wall. Symbolic tones only, like everything in the scene.

export const CUSHION_SIZE = { width: 30, height: 14 } as const;
export const MAT_SIZE = { width: 64, height: 7 } as const;
export const LOW_TABLE_SIZE = { width: 46, height: 26 } as const;
export const WALL_SHELF_SIZE = { width: 42, height: 14 } as const;
export const VASE_SIZE = { width: 18, height: 61 } as const;
export const SMOKE_SIZE = { width: 9, height: 34 } as const;
export const FLAME_SIZE = { width: 3, height: 4 } as const;

/** Paints the rows of a rounded shape: [left, width] per row. */
function shape(
  c: SceneCanvas,
  top: number,
  rows: readonly (readonly [number, number])[],
  tone: Parameters<SceneCanvas['fill']>[4],
) {
  rows.forEach(([left, w], i) => c.fill(left, top + i, w, 1, tone));
}

/** A round meditation cushion, seen from the front, pleated at its band. */
export function drawCushion(): SceneImage {
  const { width, height } = CUSHION_SIZE;
  const c = new SceneCanvas(width, height);
  const rows: [number, number][] = [
    [9, 12],
    [5, 20],
    [3, 24],
    [2, 26],
    [1, 28],
    [0, 30],
    [0, 30],
    [0, 30],
    [0, 30],
    [0, 30],
    [1, 28],
    [2, 26],
    [4, 22],
    [7, 16],
  ];
  shape(c, 0, rows, 'cushion');
  // Light on the top, shade at the bottom and on the right.
  shape(
    c,
    0,
    rows.slice(0, 4).map(([l, w]) => [l + 2, Math.max(0, w - 8)] as [number, number]),
    'cushionLight',
  );
  shape(c, 10, rows.slice(10), 'cushionShade');
  for (let y = 4; y < 10; y++) c.fill(width - 4, y, 4, 1, 'cushionShade');
  // The pleats of the band, and the button in the middle of the top.
  for (let x = 3; x < width - 3; x += 3) c.fill(x, 6, 1, 4, 'cushionShade');
  c.fill(14, 1, 2, 1, 'cushionShade');
  return c.toImage();
}

/** A round woven mat, seen almost from the side: it lies on the floor. */
export function drawMat(): SceneImage {
  const { width, height } = MAT_SIZE;
  const c = new SceneCanvas(width, height);
  const insets = [10, 3, 0, 0, 0, 3, 10];
  insets.forEach((inset, y) => {
    for (let x = inset; x < width - inset; x++) {
      // Rings of weave, one darker every other row, a stitch every 4 cells.
      const dark = y % 2 === 1 || (x + y * 2) % 4 === 0;
      c.fill(x, y, 1, 1, dark ? 'matDark' : 'mat');
    }
  });
  return c.toImage();
}

/**
 * The low table, with a candle, the seated stone figure, three pebbles and
 * a stick of incense in its holder. The candle's flame and the smoke are
 * drawn apart (drawFlame, drawSmoke), because they move.
 */
export function drawLowTable(): SceneImage {
  const { width, height } = LOW_TABLE_SIZE;
  const c = new SceneCanvas(width, height);
  const top = height - 8;
  // The table: a thick top on two short legs, lit from the left.
  c.fill(0, top, width, 3, 'tableTop');
  c.fill(0, top, width, 1, 'tableLight');
  c.fill(0, top + 2, width, 1, 'tableShade');
  c.fill(3, top + 3, 4, 5, 'tableTop');
  c.fill(width - 7, top + 3, 4, 5, 'tableShade');

  // The candle, on a small dish, and its flame (two shapes, for flicker).
  c.fill(3, top - 1, 7, 1, 'stoneShade');
  c.fill(5, top - 6, 3, 5, 'wax');
  c.fill(7, top - 6, 1, 5, 'waxShade');
  c.fill(6, top - 7, 1, 1, 'trunk');

  // The seated figure: round head, shoulders, hands in the lap, crossed legs.
  const x0 = 14;
  const rows: [number, number][] = [
    [7, 3],
    [6, 5],
    [6, 5],
    [6, 5],
    [7, 3],
    [5, 7],
    [4, 9],
    [3, 11],
    [3, 11],
    [3, 11],
    [3, 11],
    [4, 9],
    [4, 9],
    [3, 11],
    [1, 15],
    [0, 17],
    [0, 17],
    [1, 15],
  ];
  const figureTop = top - rows.length - 1;
  rows.forEach(([left, w], i) => {
    const y = figureTop + i;
    const edge = Math.max(1, Math.floor(w / 4));
    c.fill(x0 + left, y, w, 1, 'stone');
    c.fill(x0 + left, y, edge, 1, 'stoneLight');
    c.fill(x0 + left + w - edge, y, edge, 1, 'stoneShade');
  });
  c.fill(x0 + 6, figureTop + 12, 5, 1, 'stoneShade');
  c.fill(x0 + 3, figureTop + 16, 11, 1, 'stoneShade');
  c.fill(x0 - 1, top - 1, 19, 1, 'stoneShade');

  // Three pebbles, one on the other.
  c.fill(33, top - 2, 7, 2, 'stone');
  c.fill(33, top - 2, 2, 1, 'stoneLight');
  c.fill(38, top - 1, 2, 1, 'stoneShade');
  c.fill(34, top - 4, 5, 2, 'stoneShade');
  c.fill(34, top - 4, 2, 1, 'stone');
  c.fill(35, top - 6, 3, 2, 'stone');
  c.fill(35, top - 6, 1, 1, 'stoneLight');

  // The incense: a holder, a leaning stick, its ember.
  c.fill(41, top - 1, 4, 1, 'stoneShade');
  for (let i = 0; i < 9; i++) c.fill(43 - Math.floor(i / 4), top - 2 - i, 1, 1, 'trunk');
  c.fill(41, top - 11, 1, 1, 'ember');
  return c.toImage();
}

/** Where the incense's ember is in drawLowTable: the smoke starts just above it. */
export const EMBER = { x: 41, y: LOW_TABLE_SIZE.height - 8 - 11 } as const;

/** Where the candle's flame goes in drawLowTable (the top left of drawFlame). */
export const FLAME = { x: 5, y: LOW_TABLE_SIZE.height - 8 - 11 } as const;

/**
 * The candle's flame at time t: it leans and stretches a little, a few
 * times a second, never in a loop one could notice.
 */
export function drawFlame(t: number): SceneImage {
  const { width, height } = FLAME_SIZE;
  const c = new SceneCanvas(width, height);
  const beat = Math.floor(t * 4);
  const lean = sin(beat * 2.1) + sin(beat * 0.7) * 0.6;
  const side = lean > 0.6 ? 1 : lean < -0.6 ? -1 : 0;
  const tall = sin(beat * 1.7 + 1) > -0.3;
  // From the wick up: the body, then the tip, leaning with the air.
  c.fill(1, 3, 1, 1, 'sun');
  c.fill(1, 2, 1, 1, 'sunCore');
  if (side !== 0) c.fill(1 + side, 2, 1, 1, 'sun');
  if (tall) c.fill(1 + Math.max(0, side), 1, 1, 1, 'sun');
  if (tall && side === 0) c.fill(1, 0, 1, 1, 'sunCore');
  return c.toImage();
}

/**
 * The smoke of the incense at time t (seconds): wisps that rise from the
 * ember, sway, thin out and vanish, a new one every moment. The ember is at
 * the bottom of the image, in its middle column.
 */
export function drawSmoke(t: number): SceneImage {
  const { width, height } = SMOKE_SIZE;
  const c = new SceneCanvas(width, height);
  const middle = Math.floor(width / 2);
  // Rising at 4 rows per second; each row of smoke is where the stream was
  // when it left the ember, carried up since.
  for (let up = 1; up < height; up++) {
    const born = t - up / 4;
    const sway =
      sin(born * 1.3) * Math.min(3, up / 7) + sin(up / 5 + t * 0.7) * Math.min(1.2, up / 16);
    const x = middle + Math.round(sway);
    if (x < 0 || x >= width) continue;
    // Thinner and thinner: every cell low down, then fewer and fewer.
    const keep = up < 10 ? 1 : up < 20 ? 2 : 3;
    const step = Math.floor(born * 4);
    if (((step % keep) + keep) % keep !== 0) continue;
    c.fill(x, height - 1 - up, 1, 1, up < 16 ? 'incense' : 'incenseFaint');
  }
  return c.toImage();
}

/**
 * A small wall shelf on two brackets, with a stack of books and a singing
 * bowl. It hangs on the wall.
 */
export function drawWallShelf(): SceneImage {
  const { width, height } = WALL_SHELF_SIZE;
  const c = new SceneCanvas(width, height);
  const board = height - 5;
  c.fill(0, board, width, 2, 'tableTop');
  c.fill(0, board, width, 1, 'tableLight');
  // Brackets.
  for (const x of [5, width - 8]) {
    c.fill(x, board + 2, 3, 1, 'tableShade');
    c.fill(x + 1, board + 3, 2, 1, 'tableShade');
    c.fill(x + 2, board + 4, 1, 1, 'tableShade');
  }
  // Three books, lying, of three colors.
  const books: [number, number, Parameters<SceneCanvas['fill']>[4]][] = [
    [3, 18, 'bookA'],
    [4, 16, 'bookB'],
    [3, 17, 'bookC'],
  ];
  let y = board;
  for (const [x, w, tone] of books) {
    y -= 3;
    c.fill(x, y, w, 3, tone);
    c.fill(x + w - 2, y, 2, 3, 'paintPaper');
    c.fill(x, y + 2, w - 2, 1, 'bookShade');
  }
  // The singing bowl, brass, on its little cushion.
  c.fill(26, board - 1, 12, 1, 'cushion');
  const bowl: [number, number][] = [
    [24, 16],
    [24, 16],
    [25, 14],
    [26, 12],
    [28, 8],
  ];
  bowl.forEach(([x, w], i) => c.fill(x, board - 6 + i, w, 1, i === 0 ? 'brassLight' : 'brass'));
  c.fill(24, board - 6, 16, 1, 'brassLight');
  c.fill(36, board - 5, 3, 3, 'brassShade');
  // Its striker, lying beside it.
  c.fill(18, board - 1, 7, 1, 'tableShade');
  return c.toImage();
}

/** A tall vase of dried grasses: it stands on the floor line. */
export function drawVase(): SceneImage {
  const { width, height } = VASE_SIZE;
  const c = new SceneCanvas(width, height);
  const middle = Math.floor(width / 2);
  // The vase: a narrow neck on a round belly.
  const vase: [number, number][] = [
    [6, 6],
    [7, 4],
    [7, 4],
    [6, 6],
    [4, 10],
    [3, 12],
    [2, 14],
    [2, 14],
    [2, 14],
    [2, 14],
    [2, 14],
    [3, 12],
    [3, 12],
    [4, 10],
    [5, 8],
  ];
  const vaseTop = height - vase.length;
  vase.forEach(([left, w], i) => {
    c.fill(left, vaseTop + i, w, 1, 'vase');
    c.fill(left, vaseTop + i, 2, 1, 'vaseLight');
    c.fill(left + w - 3, vaseTop + i, 3, 1, 'vaseShade');
  });
  c.fill(2, vaseTop + 8, 14, 1, 'vaseShade');
  // Grasses: thin stems fanning out, each with a soft plume at its top.
  const stems: [number, number][] = [
    [-6, 42],
    [-3, 46],
    [0, 40],
    [2, 47],
    [5, 43],
    [7, 38],
  ];
  for (const [lean, length] of stems) {
    for (let i = 0; i < length; i++) {
      const x = middle + Math.round((lean * i) / length);
      const y = vaseTop - i;
      if (y < 0) break;
      const plume = i > length - 10;
      c.fill(x, y, 1, 1, plume ? 'grassPlume' : 'grass');
      if (plume && i % 2 === 0) c.fill(x + (lean < 0 ? -1 : 1), y, 1, 1, 'grassPlume');
    }
  }
  return c.toImage();
}

/** Cells between two hooks of the string of lights, and how low it hangs between them. */
const GARLAND_SPAN = 37;
const GARLAND_SAG = 6;

/**
 * The wallpaper of every wall: small sprigs on a staggered grid, barely
 * darker than the wall, a moulding along the ceiling and a string of small
 * lights hanging from it. It is drawn
 * behind everything and is not mirrored by the floor.
 */
export function drawWallpaper(width: number, height: number): SceneImage {
  const c = new SceneCanvas(width, height);
  const step = { x: 12, y: 14 };
  for (let row = 0; row * step.y < height; row++) {
    for (let col = -1; col * step.x < width; col++) {
      const x = col * step.x + (row % 2 ? step.x / 2 : 0) + 3;
      const y = row * step.y + 8;
      // A sprig: a stem and two leaves.
      c.fill(x, y, 1, 3, 'wallpaper');
      c.fill(x - 1, y + 1, 1, 1, 'wallpaper');
      c.fill(x + 1, y, 1, 1, 'wallpaper');
    }
  }
  // The moulding along the ceiling.
  c.fill(0, 0, width, 2, 'moulding');
  c.fill(0, 2, width, 1, 'mouldingShade');
  // A string of small lights under it, hooked every GARLAND_SPAN cells, sagging
  // between two hooks, a bulb every few cells.
  for (let x = 0; x < width; x++) {
    const along = (x % GARLAND_SPAN) / GARLAND_SPAN;
    const sag = Math.round(GARLAND_SAG * 4 * along * (1 - along));
    const y = 4 + sag;
    c.fill(x, y, 1, 1, 'garland');
    if (x % GARLAND_SPAN === 0) c.fill(x, 3, 1, 1, 'garland');
    if (x % 6 === 3) {
      c.fill(x, y + 1, 1, 2, 'bulb');
      c.fill(x, y + 3, 1, 1, 'bulbGlow');
    }
  }
  return c.toImage();
}

export const INCENSE_TIMER_SIZE = { width: 11, height: 58 } as const;
/** Rows of the stick when it is new. */
const STICK = 26;

/**
 * Time passing, as a stick of incense: new at the start of a session, burnt
 * down to its holder at the end (`burnt`, from 0 to 1). Its ember glows at
 * the top of what is left, and its smoke rises above it (see drawSmoke).
 */
export function drawIncenseTimer(burnt: number, t: number): SceneImage {
  const { width, height } = INCENSE_TIMER_SIZE;
  const c = new SceneCanvas(width, height);
  const middle = Math.floor(width / 2);
  // The holder: a small stone dish.
  c.fill(1, height - 2, width - 2, 1, 'stone');
  c.fill(0, height - 1, width, 1, 'stoneShade');
  c.fill(1, height - 2, 2, 1, 'stoneLight');
  const left = Math.round(STICK * (1 - Math.min(1, Math.max(0, burnt))));
  const base = height - 3;
  // The stick, then its ember, then a little ash fallen in the dish.
  for (let i = 0; i < left; i++) c.fill(middle, base - i, 1, 1, 'trunk');
  const ember = base - left;
  c.fill(middle, ember, 1, 1, 'ember');
  if (burnt > 0.05) c.fill(middle + 2, height - 3, 2, 1, 'incense');
  // The smoke, from just above the ember up to the top of the image.
  const smoke = drawSmoke(t);
  const offset = middle - Math.floor(SMOKE_SIZE.width / 2);
  const top = ember - SMOKE_SIZE.height;
  smoke.pixels.forEach((pixel, i) => {
    if (!pixel?.tone) return;
    const x = offset + (i % SMOKE_SIZE.width);
    const y = top + Math.floor(i / SMOKE_SIZE.width);
    if (y >= 0 && y < ember) c.fill(x, y, 1, 1, pixel.tone);
  });
  return c.toImage();
}
