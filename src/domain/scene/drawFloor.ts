import type { FloorItem, RoomImage } from './roomPlan';
import { SceneCanvas, type SceneImage } from './sceneImage';

// The polished floor, as wide as the whole room: dark planks that mirror
// whatever stands above them. One general rule, with no special case per
// element: the composed room is flipped at its lowest drawn row, one row out
// of two is kept (whole pixels, nothing resampled, pots and plants stay
// recognizable), and it fades away from the wall. What is too high to fit
// is left out. The seams pass over it. What lies on the floor (the rug) is
// drawn last, opaque, and is not mirrored. Its t is reserved for animation,
// like the window's.

/** Floor height in rows: as tall as the screen allows, within these bounds. */
export const FLOOR_ROWS = { max: 72, min: 28 } as const;

/** Rows above the first plank (wall line and baseboard). */
export const FLOOR_TOP = 3;

const PLANK_HEIGHTS = [4, 5, 6, 7, 8, 9, 10];
const PLANK_TONES = ['plank0', 'plank1', 'plank2'] as const;

/** Rows of the wall per row of floor: one out of two is kept. */
const STEP = 2;
/** Opacity of the reflection just under the baseboard. */
const REFLECTION_ALPHA = 0.5;
/** Fading steps: enough to look smooth, few enough to keep few colors. */
const FADE_LEVELS = 12;

export interface DrawFloorParams {
  /** Everything above the floor (see composeRoom). */
  room: RoomImage;
  /** Floor height in rows, between FLOOR_ROWS.min and FLOOR_ROWS.max. */
  rows: number;
  /** Lying on the floor, in front of everything (see RoomPlan.floorItems). */
  items?: readonly FloorItem[];
  /** Animation time, reserved: always 0 today. */
  t?: number;
}

export function drawFloor({ room, rows, items = [] }: DrawFloorParams): SceneImage {
  const width = room.width;
  const c = new SceneCanvas(width, rows);

  c.fill(0, 0, width, 2, 'wallLine');
  c.fill(0, 2, width, 1, 'baseboard');

  // Planks, wider towards the viewer; the last one runs to the bottom edge.
  const seams: { y: number; h: number; columns: number[] }[] = [];
  let y = FLOOR_TOP;
  for (let i = 0; y < rows; i++) {
    const h = Math.min(PLANK_HEIGHTS[Math.min(i, PLANK_HEIGHTS.length - 1)]!, rows - y);
    c.fill(0, y, width, h, PLANK_TONES[i % 3]!);
    c.blend(0, y, width, 1, { kind: 'tone', tone: 'shine' }, 0.05);
    const columns: number[] = [];
    for (let x = (i * 53 + 17) % 61; x < width; x += 61 + i * 7) columns.push(x);
    seams.push({ y, h, columns });
    y += h;
  }

  // The mirror.
  const depth = rows - FLOOR_TOP;
  const bottom = lowestDrawnRow(room);
  for (let r = 0; r < depth; r++) {
    const sy = bottom - r * STEP;
    if (sy < 0) break;
    const level = Math.floor((r * FADE_LEVELS) / depth);
    const alpha = REFLECTION_ALPHA * (1 - level / FADE_LEVELS);
    for (let x = 0; x < width; x++) {
      const source = room.pixels[sy * width + x];
      if (source) c.blend(x, FLOOR_TOP + r, 1, 1, source, alpha);
    }
  }

  // Seams on top: the cracks between planks are not polished.
  for (const { y: top, h, columns } of seams) {
    for (const x of columns) c.fill(x, top, 1, h, 'seam');
    if (top + h < rows) c.fill(0, top + h - 1, width, 1, 'seam');
  }

  for (const { x, y, image } of items) {
    image.pixels.forEach((pixel, i) => {
      if (pixel?.tone)
        c.fill(x + (i % image.width), y + Math.floor(i / image.width), 1, 1, pixel.tone);
    });
  }

  return c.toImage();
}

/** Last row of the room holding a pixel (-1 when it is empty). */
function lowestDrawnRow(room: RoomImage): number {
  for (let y = room.height - 1; y >= 0; y--) {
    for (let x = 0; x < room.width; x++) if (room.pixels[y * room.width + x]) return y;
  }
  return -1;
}
