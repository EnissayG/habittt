import type { HabitId } from '../habit';
import { usedRows } from '../plant/bounds';
import { PLANT_GRID, type PlantImage } from '../plant/grid';
import {
  SHELVES_PER_WALL,
  type PlantsWall,
  type ShelfLayout,
  type StandingSlot,
  type Wall,
} from '../shelf';
import { drawArmchair, drawFloorLamp, drawPainting, drawRug, FLOOR_LAMP_SIZE } from './drawDecor';
import { drawSlot, type SlotKind } from './drawSlot';
import { WINDOW_SIZE } from './drawWindow';
import type { SceneImage, SceneLayer } from './sceneImage';

// Where everything stands in the room, in cells: walls side by side, each
// centered in its page (one screen wide) and snapped to the room's cell
// grid, so the floor and the walls line up from one page to the next. Rows
// line up too, from one wall to the next. Names and counters are text (drawn by
// the UI); the plan only reserves rows for them.

/** Rows [from, to) of an image that are shown. */
export interface RowBand {
  from: number;
  to: number;
}

export type PlacedContent =
  | { kind: 'plant'; id: HabitId; image: PlantImage }
  | { kind: 'slot'; slot: SlotKind; image: SceneImage }
  | { kind: 'window'; image: SceneImage }
  /** Furniture and paintings: opaque, never labelled; only the armchair is touched. */
  | { kind: 'decor'; piece: DecorPiece; image: SceneImage };

/** What a piece of decor is: the armchair opens the meditation corner. */
export type DecorPiece = 'armchair' | 'lamp' | 'painting';

export interface PlacedItem {
  /** Left edge, in cells from the room's left edge. */
  x: number;
  /** Top edge, in cells from the room's top. */
  y: number;
  /** Rows of the image shown at (x, y). */
  rows: RowBand;
  content: PlacedContent;
  /** True when a name and a counter go under it (plants and the dotted pot). */
  labelled: boolean;
}

export interface WallPlan {
  wall: Wall;
  /** Left edge of the wall's three columns, in cells from the room's left edge. */
  left: number;
  /** Rows used by the wall, labels included, up to the floor line. */
  height: number;
  /** Back to front. */
  items: PlacedItem[];
}

/** Something lying on the floor (the rug): drawn on the planks, not mirrored. */
export interface FloorItem {
  /** Left edge, in cells from the room's left edge. */
  x: number;
  /** Top edge, in rows from the top of the floor image. */
  y: number;
  image: SceneImage;
}

export interface RoomPlan {
  /** Cells across all the pages. */
  width: number;
  /** Rows from the top of the tallest wall down to the floor line. */
  height: number;
  walls: WallPlan[];
  floorItems: FloorItem[];
}

export interface PlanRoomParams {
  layout: ShelfLayout;
  /** Plant image of every habit on the walls. */
  plants: Readonly<Record<HabitId, PlantImage>>;
  window: SceneImage;
  /** Width of one page (one wall on screen) in cells; may be fractional. */
  pageWidth: number;
  /** Rows reserved under each row of plants for names and counters. */
  labelRows: number;
  /** Empty rows between two rows (after the labels), spreading the free height. */
  rowGap?: number;
}

const COLUMN = PLANT_GRID.width;
const WALL_WIDTH = COLUMN * 3;
const H = PLANT_GRID.height;

const SLOTS: Record<'standing' | 'hanging', Record<SlotKind, SceneImage>> = {
  standing: { empty: drawSlot('empty', false), new: drawSlot('new', false) },
  hanging: { empty: drawSlot('empty', true), new: drawSlot('new', true) },
};

type Cell = Extract<PlacedContent, { kind: 'plant' | 'slot' }>;

// The decor, placed like the third wall of the mockup's whole room
// (drawPano), in cells from the wall's left edge or from the floor line.
const DECOR = {
  /** The painting of a wall of shelves, in its top band. */
  wallPainting: { x: 8, y: 4 },
  armchair: { x: 22 },
  lamp: { x: 104 },
  /** The decor wall's painting: its top this many rows above the floor line. */
  painting: { x: 78, above: 130 },
  /** The rug, in front of the armchair, a little below the baseboard. */
  rug: { x: 8, y: 2 },
} as const;

const IMAGES = {
  armchair: drawArmchair(),
  lamp: drawFloorLamp(),
  rug: drawRug(),
  peaks: drawPainting('peaks'),
  sea: drawPainting('sea'),
  bonsai: drawPainting('bonsai'),
};

/** Hanging rows show the top of the images, down to the lowest vine. */
function topBand(cells: Cell[], minimum: number): RowBand {
  const bottom = Math.max(-1, ...cells.map((cell) => usedRows(cell.image).bottom));
  return { from: 0, to: Math.min(H, Math.max(minimum, bottom + 1)) };
}

/** Standing rows show the bottom of the images, up to the tallest plant. */
function bottomBand(cells: Cell[]): RowBand {
  const top = Math.min(...cells.map((cell) => usedRows(cell.image).top));
  return { from: Math.max(0, Math.min(H, top)), to: H };
}

const height = (band: RowBand) => band.to - band.from;

export function planRoom({
  layout,
  plants,
  window,
  pageWidth,
  labelRows,
  rowGap = 0,
}: PlanRoomParams): RoomPlan {
  const plantCell = (id: HabitId): Cell => ({ kind: 'plant', id, image: plants[id]! });
  const slotCell = (slot: SlotKind, hanging: boolean): Cell => ({
    kind: 'slot',
    slot,
    image: SLOTS[hanging ? 'hanging' : 'standing'][slot],
  });
  const standingCell = (slot: StandingSlot): Cell =>
    slot.kind === 'plant' ? plantCell(slot.id) : slotCell(slot.kind, false);

  // The cells of every wall of shelves, row by row: the top band (null =
  // bare wall), then the shelves. The decor wall has none.
  const tops = layout.walls.map((wall): (Cell | null)[] => {
    if (wall.kind !== 'plants') return [];
    const hangs = wall.top.some((id) => id !== null);
    return wall.top.map((id) =>
      id !== null ? plantCell(id) : hangs ? slotCell('empty', true) : null,
    );
  });
  const shelves = layout.walls.map((wall) =>
    wall.kind === 'plants' ? wall.shelves.map((shelf) => shelf.map(standingCell)) : [],
  );

  // Rows line up from one wall to the next: each row takes the band of its
  // tallest content on any wall, so shelves continue across the swipe.
  const topCells = tops.flat().filter((cell): cell is Cell => cell !== null);
  const bands: RowBand[] = [
    topBand(
      topCells,
      layout.walls.some((wall) => wall.kind === 'plants' && wall.window) ? WINDOW_SIZE.height : 0,
    ),
    ...Array.from({ length: SHELVES_PER_WALL }, (_, row) =>
      bottomBand(shelves.flatMap((wall) => wall[row] ?? [])),
    ),
  ];
  const rowTops: number[] = [];
  let y = 0;
  bands.forEach((band, row) => {
    if (row > 0) y += rowGap;
    rowTops.push(y);
    y += height(band) + labelRows;
  });
  // The floor lamp stands on the floor line: the room is never lower than it.
  const roomHeight = Math.max(y, FLOOR_LAMP_SIZE.height);
  const floorItems: FloorItem[] = [];

  const walls = layout.walls.map((wall, w): WallPlan => {
    const left = Math.round(wall.index * pageWidth + (pageWidth - WALL_WIDTH) / 2);
    if (wall.kind === 'decor') {
      floorItems.push({ x: left + DECOR.rug.x, y: DECOR.rug.y, image: IMAGES.rug });
      return { wall, left, height: roomHeight, items: decorItems(left, roomHeight) };
    }
    const items: PlacedItem[] = plantsWallDecor(wall, left, rowTops[0]!);
    if (wall.window) {
      items.push({
        x: left + COLUMN,
        y: rowTops[0]!,
        rows: { from: 0, to: WINDOW_SIZE.height },
        content: { kind: 'window', image: window },
        labelled: false,
      });
    }
    tops[w]!.forEach((cell, i) => {
      if (!cell) return;
      const labelled = cell.kind === 'plant';
      items.push({
        x: left + i * COLUMN,
        y: rowTops[0]!,
        rows: bands[0]!,
        content: cell,
        labelled,
      });
    });
    shelves[w]!.forEach((cells, row) => {
      cells.forEach((cell, i) => {
        const labelled = cell.kind === 'plant' || cell.slot === 'new';
        const band = bands[row + 1]!;
        items.push({
          x: left + i * COLUMN,
          y: rowTops[row + 1]!,
          rows: band,
          content: cell,
          labelled,
        });
      });
    });
    return { wall, left, height: roomHeight, items };
  });

  return {
    width: Math.ceil(layout.walls.length * pageWidth),
    height: roomHeight,
    walls,
    floorItems,
  };
}

/** A whole image placed at (x, y). */
function placeDecor(piece: DecorPiece, image: SceneImage, x: number, y: number): PlacedItem {
  return {
    x,
    y,
    rows: { from: 0, to: image.height },
    content: { kind: 'decor', piece, image },
    labelled: false,
  };
}

/** A wall of shelves: its painting, in the top band, behind everything. */
function plantsWallDecor(wall: PlantsWall, left: number, top: number): PlacedItem[] {
  if (!wall.painting) return [];
  const { x, y } = DECOR.wallPainting;
  return [placeDecor('painting', IMAGES[wall.painting], left + x, top + y)];
}

/** The decor wall, back to front: the painting, the armchair, the lamp beside it. */
function decorItems(left: number, floorLine: number): PlacedItem[] {
  const standing = (piece: DecorPiece, image: SceneImage, x: number) =>
    placeDecor(piece, image, left + x, floorLine - image.height);
  // In a low room the painting comes down rather than being cut (the room
  // is always taller than the lamp, so the furniture never is).
  return [
    placeDecor(
      'painting',
      IMAGES.peaks,
      left + DECOR.painting.x,
      Math.max(0, floorLine - DECOR.painting.above),
    ),
    standing('armchair', IMAGES.armchair, DECOR.armchair.x),
    standing('lamp', IMAGES.lamp, DECOR.lamp.x),
  ];
}

/** What one cell of the composed room shows: a scene tone or a plant pixel. */
export type RoomSource = SceneLayer['source'];

export interface RoomImage {
  readonly width: number;
  readonly height: number;
  /** Row-major; null = bare wall. */
  readonly pixels: readonly (RoomSource | null)[];
}

/**
 * Everything drawn above the floor, as one image: what the polished floor
 * mirrors. Scene pixels keep their base tone (their translucent glints are
 * left out); later furniture or paintings are mirrored as soon as they are
 * placed in the plan.
 */
export function composeRoom(plan: RoomPlan): RoomImage {
  const pixels = new Array<RoomSource | null>(plan.width * plan.height).fill(null);
  for (const wall of plan.walls) {
    for (const { x, y, rows, content } of wall.items) {
      const { image } = content;
      for (let row = rows.from; row < rows.to; row++) {
        const ry = y + row - rows.from;
        if (ry < 0 || ry >= plan.height) continue;
        for (let col = 0; col < image.width; col++) {
          const rx = x + col;
          if (rx < 0 || rx >= plan.width) continue;
          const source = sourceAt(content, col, row);
          if (source) pixels[ry * plan.width + rx] = source;
        }
      }
    }
  }
  return { width: plan.width, height: plan.height, pixels };
}

function sourceAt(content: PlacedContent, x: number, y: number): RoomSource | null {
  if (content.kind === 'plant') {
    const pixel = content.image.pixels[y * content.image.width + x];
    return pixel ? { kind: 'plant', pixel, genome: content.image.genome } : null;
  }
  const tone = content.image.pixels[y * content.image.width + x]?.tone;
  return tone ? { kind: 'tone', tone } : null;
}
