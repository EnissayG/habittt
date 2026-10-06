import type { HabitId } from '../habit';
import { usedRows } from '../plant/bounds';
import { PLANT_GRID, type PlantImage } from '../plant/grid';
import { SHELVES_PER_WALL, type ShelfLayout, type StandingSlot, type Wall } from '../shelf';
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
  | { kind: 'window'; image: SceneImage };

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

export interface RoomPlan {
  /** Cells across all the pages. */
  width: number;
  /** Rows from the top of the tallest wall down to the floor line. */
  height: number;
  walls: WallPlan[];
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
  /** Empty rows after each row's labels, spreading the free height. */
  rowGap?: number;
}

const COLUMN = PLANT_GRID.width;
const WALL_WIDTH = COLUMN * 3;
const H = PLANT_GRID.height;

const SLOTS: Record<'standing' | 'hanging', Record<SlotKind, SceneImage>> = {
  standing: { empty: drawSlot('empty', false), new: drawSlot('new', false) },
  hanging: { empty: drawSlot('empty', true), new: drawSlot('new', true) },
};

type Cell = Exclude<PlacedContent, { kind: 'window' }>;

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

  // The cells of every wall, row by row: the top band (null = bare wall),
  // then the shelves.
  const tops = layout.walls.map((wall): (Cell | null)[] => {
    const hangs = wall.top.some((id) => id !== null);
    return wall.top.map((id) =>
      id !== null ? plantCell(id) : hangs ? slotCell('empty', true) : null,
    );
  });
  const shelves = layout.walls.map((wall) => wall.shelves.map((shelf) => shelf.map(standingCell)));

  // Rows line up from one wall to the next: each row takes the band of its
  // tallest content on any wall, so shelves continue across the swipe.
  const topCells = tops.flat().filter((cell): cell is Cell => cell !== null);
  const bands: RowBand[] = [
    topBand(topCells, layout.walls.some((wall) => wall.window) ? WINDOW_SIZE.height : 0),
    ...Array.from({ length: SHELVES_PER_WALL }, (_, row) =>
      bottomBand(shelves.flatMap((wall) => wall[row] ?? [])),
    ),
  ];
  const rowTops: number[] = [];
  let y = 0;
  for (const band of bands) {
    rowTops.push(y);
    y += height(band) + labelRows + rowGap;
  }
  const roomHeight = y;

  const walls = layout.walls.map((wall, w): WallPlan => {
    const left = Math.round(wall.index * pageWidth + (pageWidth - WALL_WIDTH) / 2);
    const items: PlacedItem[] = [];
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

  return { width: Math.ceil(layout.walls.length * pageWidth), height: roomHeight, walls };
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
