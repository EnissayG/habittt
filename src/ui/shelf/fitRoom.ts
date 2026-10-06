import { FLOOR_ROWS, PLANT_GRID, type RoomPlan } from '../../domain';

// The scale of the shelf room. One whole number of device pixels per cell
// for every wall, plant, window and floor pixel. The room fills the screen
// edge to edge: three plants across at most; when the walls are too tall,
// the floor gets shorter first (down to its minimum), then the scale drops.

const WALL_WIDTH = PLANT_GRID.width * 3;

export interface FitRoomParams {
  screen: { width: number; height: number };
  pixelRatio: number;
  /** Safe area: the status bar above, the home indicator below. */
  insets: { top: number; bottom: number };
  /** Logo and totals, under the status bar. */
  headerHeight: number;
  /** Name and counter under a plant, gap included, in points. */
  labelHeight: number;
  /** Wall indicator, standing on the floor above the home indicator. */
  dotsHeight: number;
  /** Plans the room for a page width and label height, both in cells. */
  plan: (geometry: { pageWidth: number; labelRows: number }) => RoomPlan;
}

export interface RoomFit {
  devicePixelsPerCell: number;
  /** One cell, in points. */
  cell: number;
  /** One page (the screen's width) in cells; may be fractional. */
  pageWidth: number;
  labelRows: number;
  plan: RoomPlan;
  floorRows: number;
  /** Top of the floor, in points from the top of the screen. */
  floorTop: number;
  /** Top of the tallest wall, in points from the top of the screen. */
  roomTop: number;
}

export function fitRoom(params: FitRoomParams): RoomFit {
  const { screen, pixelRatio, insets } = params;
  const widest = Math.max(1, Math.floor((screen.width * pixelRatio) / WALL_WIDTH));

  // Largest scale whose floor keeps its minimum height and room for the dots.
  let fit = attempt(params, widest);
  for (let k = widest - 1; k >= 1 && !fits(fit, insets.bottom + params.dotsHeight); k--) {
    fit = attempt(params, k);
  }
  return settle(fit, screen.height);
}

function fits(fit: RoomFit, floorMinimum: number): boolean {
  return fit.floorRows >= FLOOR_ROWS.min && fit.floorRows * fit.cell >= floorMinimum;
}

/** The room at k device pixels per cell, the floor taking the free rows. */
function attempt(params: FitRoomParams, k: number): RoomFit {
  const { screen, pixelRatio, insets } = params;
  const cell = k / pixelRatio;
  const pageWidth = screen.width / cell;
  const labelRows = Math.ceil(params.labelHeight / cell);
  const plan = params.plan({ pageWidth, labelRows });
  const free = screen.height - insets.top - params.headerHeight - plan.height * cell;
  const floorRows = Math.min(FLOOR_ROWS.max, Math.floor(free / cell));
  return {
    devicePixelsPerCell: k,
    cell,
    pageWidth,
    labelRows,
    plan,
    floorRows,
    floorTop: 0,
    roomTop: 0,
  };
}

/** Puts the floor at the bottom of the screen and the walls on it. */
function settle(fit: RoomFit, screenHeight: number): RoomFit {
  const floorRows = Math.max(FLOOR_ROWS.min, fit.floorRows);
  const floorTop = screenHeight - floorRows * fit.cell;
  return { ...fit, floorRows, floorTop, roomTop: floorTop - fit.plan.height * fit.cell };
}
