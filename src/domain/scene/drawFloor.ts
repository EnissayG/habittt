import type { FloorItem, RoomImage } from './roomPlan';
import { SceneCanvas, type SceneImage } from './sceneImage';

// The polished floor, as wide as the whole room: dark planks that mirror
// whatever stands above them. It is the reflection of the mockup's whole
// room (drawPano) without its wave: polished wood, not water, so it keeps
// still. One general rule, with no special case per element:
//
// - a true mirror: the composed room is flipped at its lowest drawn row, at
//   full size, one row of floor per row of wall, each column under itself.
//   What is too high to fit is left out;
// - it fades with the distance, and the bare wall hardly shows in it.
//
// It lies over the planks and their seams. What lies on the floor (the rug)
// is drawn last, opaque, and is not mirrored.

/** Floor height in rows: as tall as the screen allows, within these bounds. */
export const FLOOR_ROWS = { max: 72, min: 28 } as const;

/** Rows above the first plank (wall line and baseboard). */
export const FLOOR_TOP = 3;

const PLANK_HEIGHTS = [4, 5, 6, 7, 8, 9, 10];
const PLANK_TONES = ['plank0', 'plank1', 'plank2'] as const;

/** The reflection, as in the mockup. */
export const REFLECTION = {
  /** Opacity of what stands in the room, just under the baseboard. */
  object: 0.62,
  /** Opacity of the bare wall, just under the baseboard. */
  wall: 0.1,
  /** How fast it fades towards the viewer (1 = evenly). */
  fade: 1.3,
} as const;

/** One row of the floor that mirrors a row of the room. */
export interface MirrorRow {
  /** Row of the floor image. */
  y: number;
  /** Row of the room it mirrors. */
  source: number;
  /** 1 under the baseboard, 0 at the bottom edge. */
  fade: number;
}

/** The rows of the floor that mirror the room, top to bottom. */
export function mirrorRows(room: RoomImage, rows: number): MirrorRow[] {
  const depth = rows - FLOOR_TOP;
  const bottom = lowestDrawnRow(room);
  const result: MirrorRow[] = [];
  for (let r = 0; r < depth && r <= bottom; r++) {
    result.push({
      y: FLOOR_TOP + r,
      source: bottom - r,
      fade: Math.pow(1 - r / depth, REFLECTION.fade),
    });
  }
  return result;
}

/** The floor with nothing in it: wall line, baseboard, planks and their seams. */
export function drawFloorBoards(width: number, rows: number): SceneImage {
  const c = new SceneCanvas(width, rows);
  paintBoards(c);
  return c.toImage();
}

/** What lies on the floor (the rug), alone: everything else is left empty. */
export function drawFloorItems(
  width: number,
  rows: number,
  items: readonly FloorItem[],
): SceneImage {
  const c = new SceneCanvas(width, rows);
  paintItems(c, items);
  return c.toImage();
}

export interface DrawFloorParams {
  /** Everything above the floor (see composeRoom). */
  room: RoomImage;
  /** Floor height in rows, between FLOOR_ROWS.min and FLOOR_ROWS.max. */
  rows: number;
  /** Lying on the floor, in front of everything (see RoomPlan.floorItems). */
  items?: readonly FloorItem[];
}

/**
 * The whole floor in one image: boards, reflection, rug. The shelf draws
 * the same three layers with the reflection as one image (see floorMirror),
 * which is much cheaper to draw than one shape per color.
 */
export function drawFloor({ room, rows, items = [] }: DrawFloorParams): SceneImage {
  const width = room.width;
  const c = new SceneCanvas(width, rows);
  paintBoards(c);
  for (const { y, source, fade } of mirrorRows(room, rows)) {
    for (let x = 0; x < width; x++) {
      const mirrored = room.pixels[source * width + x];
      if (mirrored) c.blend(x, y, 1, 1, mirrored, REFLECTION.object * fade);
      else c.blend(x, y, 1, 1, { kind: 'tone', tone: 'wall' }, REFLECTION.wall * fade);
    }
  }
  paintItems(c, items);
  return c.toImage();
}

function paintBoards(c: SceneCanvas): void {
  const { width, height: rows } = c;
  c.fill(0, 0, width, 2, 'wallLine');
  c.fill(0, 2, width, 1, 'baseboard');

  // Planks, wider towards the viewer; the last one runs to the bottom edge.
  let y = FLOOR_TOP;
  for (let i = 0; y < rows; i++) {
    const h = Math.min(PLANK_HEIGHTS[Math.min(i, PLANK_HEIGHTS.length - 1)]!, rows - y);
    c.fill(0, y, width, h, PLANK_TONES[i % 3]!);
    c.blend(0, y, width, 1, { kind: 'tone', tone: 'shine' }, 0.05);
    for (let x = (i * 53 + 17) % 61; x < width; x += 61 + i * 7) c.fill(x, y, 1, h, 'seam');
    if (y + h < rows) c.fill(0, y + h - 1, width, 1, 'seam');
    y += h;
  }
}

function paintItems(c: SceneCanvas, items: readonly FloorItem[]): void {
  for (const { x, y, image } of items) {
    image.pixels.forEach((pixel, i) => {
      if (pixel?.tone)
        c.fill(x + (i % image.width), y + Math.floor(i / image.width), 1, 1, pixel.tone);
    });
  }
}

/** Last row of the room holding a pixel (-1 when it is empty). */
function lowestDrawnRow(room: RoomImage): number {
  for (let y = room.height - 1; y >= 0; y--) {
    for (let x = 0; x < room.width; x++) if (room.pixels[y * room.width + x]) return y;
  }
  return -1;
}
