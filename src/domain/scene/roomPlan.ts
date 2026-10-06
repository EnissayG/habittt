import type { HabitId } from '../habit';
import { usedRows } from '../plant/bounds';
import { PLANT_GRID, type PlantImage } from '../plant/grid';
import type { ShelfLayout, StandingSlot, Wall } from '../shelf';
import { drawSlot, type SlotKind } from './drawSlot';
import { WINDOW_SIZE } from './drawWindow';
import type { SceneImage, SceneLayer } from './sceneImage';

// Where everything stands in the room, in cells: walls side by side, each
// centered in its page (one screen wide) and snapped to the room's cell
// grid, so the floor and the walls line up from one page to the next. Every
// wall sits on the same floor line. Names and counters are text (drawn by
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
}: PlanRoomParams): RoomPlan {
  const plantCell = (id: HabitId): Cell => ({ kind: 'plant', id, image: plants[id]! });
  const slotCell = (slot: SlotKind, hanging: boolean): Cell => ({
    kind: 'slot',
    slot,
    image: SLOTS[hanging ? 'hanging' : 'standing'][slot],
  });
  const standingCell = (slot: StandingSlot): Cell =>
    slot.kind === 'plant' ? plantCell(slot.id) : slotCell(slot.kind, false);

  // Each wall is first laid out from its own top (y = 0), then moved down
  // onto the floor line.
  const walls = layout.walls.map((wall): WallPlan => {
    const left = Math.round(wall.index * pageWidth + (pageWidth - WALL_WIDTH) / 2);
    const items: PlacedItem[] = [];
    let y = 0;

    const hangs = wall.top.some((id) => id !== null);
    if (wall.window || hangs) {
      const cells: (Cell | null)[] = wall.top.map((id) =>
        id !== null ? plantCell(id) : wall.window ? null : slotCell('empty', true),
      );
      const band = topBand(
        cells.filter((cell): cell is Cell => cell !== null),
        wall.window ? WINDOW_SIZE.height : 0,
      );
      if (wall.window) {
        items.push({
          x: left + COLUMN,
          y,
          rows: { from: 0, to: WINDOW_SIZE.height },
          content: { kind: 'window', image: window },
          labelled: false,
        });
      }
      cells.forEach((cell, i) => {
        if (cell)
          items.push({
            x: left + i * COLUMN,
            y,
            rows: band,
            content: cell,
            labelled: cell.kind === 'plant',
          });
      });
      y += height(band) + labelRows;
    }

    for (const shelf of wall.shelves) {
      const cells = shelf.map(standingCell);
      const band = bottomBand(cells);
      cells.forEach((cell, i) => {
        const labelled = cell.kind === 'plant' || cell.slot === 'new';
        items.push({ x: left + i * COLUMN, y, rows: band, content: cell, labelled });
      });
      y += height(band) + labelRows;
    }

    return { wall, left, height: y, items };
  });

  const roomHeight = Math.max(0, ...walls.map((wall) => wall.height));
  for (const wall of walls) {
    const drop = roomHeight - wall.height;
    for (const placed of wall.items) placed.y += drop;
  }

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
