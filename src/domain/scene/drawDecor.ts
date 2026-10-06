import { SceneCanvas, type SceneImage } from './sceneImage';

// The furniture and pictures of the room, ported from the "whole room" view
// of the mockup (docs/prototypes/maquette-habittt.html, drawPano).
//
// Everything is drawn at the scale of the plants: one cell here is one cell
// of a plant. A pot is about 15 cells wide, so the armchair is as tall as two
// shelves and the lamp stands a little taller than it. Like the window, these
// images hold symbolic tones only; the UI theme gives the colors.

export const ARMCHAIR_SIZE = { width: 56, height: 52 } as const;
export const FLOOR_LAMP_SIZE = { width: 17, height: 80 } as const;
export const PAINTING_SIZE = { width: 40, height: 30 } as const;
export const RUG_SIZE = { width: 84, height: 9 } as const;

export const PAINTINGS = ['day', 'sunset', 'leaf'] as const;
export type Painting = (typeof PAINTINGS)[number];

/** An armchair seen from the front. It stands on the floor line (its last row). */
export function drawArmchair(): SceneImage {
  const c = new SceneCanvas(ARMCHAIR_SIZE.width, ARMCHAIR_SIZE.height);
  // Backrest, with softened top corners.
  c.fill(7, 0, 42, 1, 'chair');
  c.fill(6, 1, 44, 29, 'chair');
  c.fill(7, 0, 42, 2, 'chairLight');
  c.fill(44, 2, 6, 28, 'chairShade');
  // Armrests.
  c.fill(0, 19, 10, 27, 'chairShade');
  c.fill(1, 18, 8, 1, 'chairShade');
  c.fill(46, 19, 10, 27, 'chairDark');
  c.fill(47, 18, 8, 1, 'chairDark');
  c.fill(0, 19, 10, 2, 'chair');
  c.fill(46, 19, 10, 2, 'chair');
  // Seat cushion and base.
  c.fill(10, 26, 36, 10, 'chairLight');
  c.fill(10, 34, 36, 2, 'chair');
  c.fill(4, 36, 48, 10, 'chair');
  c.fill(4, 44, 48, 2, 'chairShade');
  // Legs.
  c.fill(6, 46, 3, 6, 'trunk');
  c.fill(47, 46, 3, 6, 'trunk');
  return c.toImage();
}

/** A floor lamp: a wide shade on a thin pole. It stands on the floor line. */
export function drawFloorLamp(): SceneImage {
  const { width, height } = FLOOR_LAMP_SIZE;
  const c = new SceneCanvas(width, height);
  const middle = Math.floor(width / 2);
  for (let row = 0; row < 10; row++) {
    const half = 3 + Math.floor(row / 2);
    const tone = row < 2 ? 'lampLight' : row === 9 ? 'frameLight' : 'lampShade';
    c.fill(middle - half, row, half * 2 + 1, 1, tone);
  }
  c.fill(middle, 10, 1, height - 12, 'frameDark');
  c.fill(middle - 4, height - 2, 9, 2, 'frameDark');
  return c.toImage();
}

/** A framed picture for the wall. */
export function drawPainting(painting: Painting): SceneImage {
  const { width, height } = PAINTING_SIZE;
  const c = new SceneCanvas(width, height);
  c.fill(0, 0, width, height, 'frameDark');
  c.fill(1, 1, width - 2, height - 2, 'frame');
  c.fill(1, 1, width - 2, 1, 'frameLight');
  c.fill(1, height - 2, width - 2, 1, 'frameShade');
  const x0 = 3;
  const y0 = 3;
  const w = width - 6;
  const h = height - 6;
  if (painting === 'leaf') {
    c.fill(x0, y0, w, h, 'paintPaper');
    // One big leaf on its stem, slightly off-center.
    const cx = x0 + Math.floor(w / 2) + 1;
    const cy = y0 + 10;
    for (let dy = -8; dy <= 8; dy++) {
      const half = Math.round(6 * Math.sqrt(1 - (dy * dy) / 72));
      c.fill(cx - half, cy + dy, half * 2 + 1, 1, 'paintHill');
    }
    c.fill(cx, cy - 7, 1, 19, 'paintHillDark');
    for (const dy of [-4, 0, 4]) {
      c.fill(cx - 3, cy + dy + 1, 3, 1, 'paintHillDark');
      c.fill(cx + 1, cy + dy - 1, 3, 1, 'paintHillDark');
    }
    return c.toImage();
  }
  const dusk = painting === 'sunset';
  c.fill(x0, y0, w, h, dusk ? 'paintDusk' : 'paintSky');
  c.fill(x0 + w - 9, y0 + (dusk ? 9 : 3), 4, 4, dusk ? 'sunCore' : 'sun');
  // Two rounded hills, the same in both pictures.
  for (let x = 0; x < w; x++) {
    const far = 5 + Math.round(3 * Math.sqrt(Math.max(0, 1 - ((x - 9) * (x - 9)) / 150)));
    const near = 3 + Math.round(4 * Math.sqrt(Math.max(0, 1 - ((x - 25) * (x - 25)) / 200)));
    c.fill(x0 + x, y0 + h - far, 1, far, dusk ? 'paintHillDark' : 'paintHill');
    c.fill(x0 + x, y0 + h - near, 1, near, dusk ? 'paintHill' : 'paintHillDark');
  }
  return c.toImage();
}

/** A striped rug with rounded ends, seen almost from the side. It lies on the floor. */
export function drawRug(): SceneImage {
  const { width, height } = RUG_SIZE;
  const c = new SceneCanvas(width, height);
  for (let row = 0; row < height; row++) {
    const inset = row === 0 || row === height - 1 ? 3 : row === 1 || row === height - 2 ? 1 : 0;
    c.fill(inset, row, width - inset * 2, 1, row % 4 < 2 ? 'rugA' : 'rugB');
  }
  return c.toImage();
}
