import { FLOOR_ROWS, type RoomPlan } from '../../domain';
import { fitRoom, type FitRoomParams } from './fitRoom';

type Geometry = { pageWidth: number; labelRows: number; rowGap: number };

/** A fake room: `rows` of content, three label bands and three gaps. */
const planOf =
  (rows: number) =>
  ({ pageWidth, labelRows, rowGap }: Geometry): RoomPlan => ({
    width: Math.ceil(pageWidth),
    height: rows + 3 * labelRows + 3 * rowGap,
    walls: [],
  });

const IPHONE: Omit<FitRoomParams, 'plan'> = {
  screen: { width: 393, height: 852 },
  pixelRatio: 3,
  insets: { top: 59, bottom: 34 },
  headerHeight: 64,
  labelHeight: 37,
  dotsHeight: 24,
};

/** Rows between the header and the bottom edge, at a scale. */
const availableRows = (cell: number) => Math.floor((852 - 59 - 64) / cell);

describe('fitRoom', () => {
  it('puts three plants across the screen when the room fits', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    expect(fit.devicePixelsPerCell).toBe(Math.floor((393 * 3) / 144));
    expect(fit.cell).toBe(fit.devicePixelsPerCell / 3);
  });

  it('reserves whole rows for the labels', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    expect(fit.labelRows).toBe(Math.ceil(37 / fit.cell));
  });

  it('puts the walls right under the header and the floor down to the bottom edge', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    expect(fit.roomTop).toBe(59 + 64);
    expect(fit.floorTop).toBeCloseTo(fit.roomTop + fit.plan.height * fit.cell, 9);
    expect(fit.floorTop + fit.floorRows * fit.cell).toBeGreaterThanOrEqual(852 - 1e-9);
    expect(fit.floorTop + (fit.floorRows - 1) * fit.cell).toBeLessThan(852);
  });

  it('shares the spare height between the floor and even gaps', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    const spare = availableRows(fit.cell) - (100 + 3 * fit.labelRows) - FLOOR_ROWS.min;
    expect(spare).toBeGreaterThan(0);
    expect(fit.rowGap).toBeGreaterThan(0);
    const toFloor = Math.min(FLOOR_ROWS.max - FLOOR_ROWS.min, Math.floor(spare / 2));
    expect(fit.floorRows - FLOOR_ROWS.min).toBeGreaterThanOrEqual(toFloor);
    expect(fit.rowGap).toBe(Math.floor((spare - toFloor) / 3));
  });

  it('never gives the floor much more than its maximum, the rest goes to the gaps', () => {
    const fit = fitRoom({ ...IPHONE, screen: { width: 393, height: 1400 }, plan: planOf(100) });
    expect(fit.floorRows).toBeLessThanOrEqual(FLOOR_ROWS.max + 4);
    expect(fit.rowGap).toBeGreaterThan(20);
  });

  it('shortens the floor before lowering the scale', () => {
    const roomy = fitRoom({ ...IPHONE, plan: planOf(100) });
    const rows = availableRows(roomy.cell) - 3 * roomy.labelRows - 30;
    const fit = fitRoom({ ...IPHONE, plan: planOf(rows) });
    expect(fit.devicePixelsPerCell).toBe(roomy.devicePixelsPerCell);
    expect(fit.rowGap).toBe(0);
    expect(fit.floorRows).toBeGreaterThanOrEqual(FLOOR_ROWS.min);
    expect(fit.floorRows).toBeLessThanOrEqual(31);
  });

  it('lowers the scale only when the floor would go under its minimum', () => {
    const roomy = fitRoom({ ...IPHONE, plan: planOf(100) });
    const rows = availableRows(roomy.cell) - 3 * roomy.labelRows - FLOOR_ROWS.min + 2;
    const fit = fitRoom({ ...IPHONE, plan: planOf(rows) });
    expect(fit.devicePixelsPerCell).toBeLessThan(roomy.devicePixelsPerCell);
    expect(fit.floorRows).toBeGreaterThanOrEqual(FLOOR_ROWS.min);
  });

  it('keeps the floor tall enough for the dots above the home indicator', () => {
    const fit = fitRoom({ ...IPHONE, insets: { top: 59, bottom: 90 }, plan: planOf(200) });
    expect(fit.floorRows * fit.cell).toBeGreaterThanOrEqual(90 + 24);
  });

  it('gives each page its width in cells', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    expect(fit.pageWidth).toBeCloseTo(393 / fit.cell, 9);
  });

  it('still returns a room at the smallest scale on a tiny screen', () => {
    const fit = fitRoom({ ...IPHONE, screen: { width: 320, height: 300 }, plan: planOf(400) });
    expect(fit.devicePixelsPerCell).toBe(1);
  });
});
