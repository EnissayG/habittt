import { FLOOR_ROWS, PLANT_GRID, type RoomPlan } from '../../domain';

// The scale and the vertical layout of the shelf room. One whole number of
// device pixels per cell for every wall, plant, window and floor pixel. The
// room fills the screen edge to edge: three plants across at most; the
// window sits right under the header. When the walls are too tall, the
// floor gets shorter first (down to its minimum), then the scale drops.
// When there is room to spare, half of it goes to the floor (up to its
// maximum) and the rest spreads the rows evenly.

const WALL_WIDTH = PLANT_GRID.width * 3;
/** Gaps spread the free height: after the top band and after each shelf. */
const GAPS = 3;

export interface FitRoomParams {
  screen: { width: number; height: number };
  pixelRatio: number;
  /** Safe area: the status bar above, the home indicator below. */
  insets: { top: number; bottom: number };
  /** Logo and totals, under the status bar. */
  headerHeight: number;
  /** Name and counter under a plant, in points. */
  labelHeight: number;
  /** Wall indicator, standing on the floor above the home indicator. */
  dotsHeight: number;
  /** Plans the room for a page width, label height and row gap, in cells. */
  plan: (geometry: { pageWidth: number; labelRows: number; rowGap: number }) => RoomPlan;
}

export interface RoomFit {
  devicePixelsPerCell: number;
  /** One cell, in points. */
  cell: number;
  /** One page (the screen's width) in cells; may be fractional. */
  pageWidth: number;
  labelRows: number;
  rowGap: number;
  plan: RoomPlan;
  /** Floor rows down to the bottom edge (the last one may be cut by it). */
  floorRows: number;
  /** Top of the floor, in points from the top of the screen. */
  floorTop: number;
  /** Top of the walls (right under the header), in points from the top of the screen. */
  roomTop: number;
}

export function fitRoom(params: FitRoomParams): RoomFit {
  const { screen, pixelRatio } = params;
  const widest = Math.max(1, Math.floor((screen.width * pixelRatio) / WALL_WIDTH));
  let fit = attempt(params, widest);
  for (let k = widest - 1; k >= 1 && !fits(fit, params); k--) fit = attempt(params, k);
  return fit;
}

function fits(fit: RoomFit, params: FitRoomParams): boolean {
  return (
    fit.floorRows >= FLOOR_ROWS.min &&
    fit.floorRows * fit.cell >= params.insets.bottom + params.dotsHeight
  );
}

/** The room at k device pixels per cell. */
function attempt(params: FitRoomParams, k: number): RoomFit {
  const { screen, pixelRatio, insets } = params;
  const cell = k / pixelRatio;
  const pageWidth = screen.width / cell;
  const labelRows = Math.ceil(params.labelHeight / cell);
  const roomTop = insets.top + params.headerHeight;
  const available = Math.floor((screen.height - roomTop) / cell);

  const tight = params.plan({ pageWidth, labelRows, rowGap: 0 });
  const spare = available - tight.height - FLOOR_ROWS.min;
  const toFloor = Math.min(FLOOR_ROWS.max - FLOOR_ROWS.min, Math.floor(Math.max(0, spare) / 2));
  const rowGap = Math.max(0, Math.floor((spare - toFloor) / GAPS));
  const plan = rowGap > 0 ? params.plan({ pageWidth, labelRows, rowGap }) : tight;

  const floorTop = roomTop + plan.height * cell;
  const floorRows = Math.ceil((screen.height - floorTop) / cell - 1e-9);
  return {
    devicePixelsPerCell: k,
    cell,
    pageWidth,
    labelRows,
    rowGap,
    plan,
    floorRows,
    floorTop,
    roomTop,
  };
}
