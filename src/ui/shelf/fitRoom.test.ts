import { FLOOR_ROWS, type RoomPlan } from '../../domain';
import { fitRoom, type FitRoomParams } from './fitRoom';

/** A fake room whose walls are `rows` tall plus three label bands. */
const planOf =
  (rows: number) =>
  ({ pageWidth, labelRows }: { pageWidth: number; labelRows: number }): RoomPlan => ({
    width: Math.ceil(pageWidth),
    height: rows + 3 * labelRows,
    walls: [],
  });

const IPHONE: Omit<FitRoomParams, 'plan'> = {
  screen: { width: 393, height: 852 },
  pixelRatio: 3,
  insets: { top: 59, bottom: 34 },
  headerHeight: 64,
  labelHeight: 40,
  dotsHeight: 20,
};

describe('fitRoom', () => {
  it('puts three plants across the screen when the room fits', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    expect(fit.devicePixelsPerCell).toBe(Math.floor((393 * 3) / 144));
    expect(fit.cell).toBe(fit.devicePixelsPerCell / 3);
    expect(fit.floorRows).toBe(FLOOR_ROWS.max);
  });

  it('reserves whole rows for the labels', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    expect(fit.labelRows).toBe(Math.ceil(40 / fit.cell));
    expect(fit.plan.height).toBe(100 + 3 * fit.labelRows);
  });

  it('shortens the floor before lowering the scale', () => {
    const roomy = fitRoom({ ...IPHONE, plan: planOf(100) });
    // Just tall enough to eat into the floor at the same scale.
    const freeRows = Math.floor((852 - 59 - 64) / roomy.cell) - 3 * roomy.labelRows;
    const fit = fitRoom({ ...IPHONE, plan: planOf(freeRows - 40) });
    expect(fit.devicePixelsPerCell).toBe(roomy.devicePixelsPerCell);
    expect(fit.floorRows).toBe(40);
  });

  it('lowers the scale only when the floor would go under its minimum', () => {
    const roomy = fitRoom({ ...IPHONE, plan: planOf(100) });
    const freeRows = Math.floor((852 - 59 - 64) / roomy.cell) - 3 * roomy.labelRows;
    const fit = fitRoom({ ...IPHONE, plan: planOf(freeRows - FLOOR_ROWS.min + 1) });
    expect(fit.devicePixelsPerCell).toBeLessThan(roomy.devicePixelsPerCell);
    expect(fit.floorRows).toBeGreaterThanOrEqual(FLOOR_ROWS.min);
  });

  it('lays the room out to the bottom edge of the screen', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(150) });
    expect(fit.floorTop + fit.floorRows * fit.cell).toBeCloseTo(852, 5);
    expect(fit.roomTop + fit.plan.height * fit.cell).toBeCloseTo(fit.floorTop, 5);
    expect(fit.roomTop).toBeGreaterThanOrEqual(59 + 64 - 1e-9);
  });

  it('keeps the floor tall enough for the dots above the home indicator', () => {
    const fit = fitRoom({ ...IPHONE, insets: { top: 59, bottom: 90 }, plan: planOf(100) });
    expect(fit.floorRows * fit.cell).toBeGreaterThanOrEqual(90 + 20);
  });

  it('gives each page its width in cells, on whole device pixels', () => {
    const fit = fitRoom({ ...IPHONE, plan: planOf(100) });
    expect(fit.pageWidth).toBeCloseTo(393 / fit.cell, 9);
  });

  it('still returns a room at the smallest scale on a tiny screen', () => {
    const fit = fitRoom({ ...IPHONE, screen: { width: 320, height: 300 }, plan: planOf(400) });
    expect(fit.devicePixelsPerCell).toBe(1);
    expect(fit.floorRows).toBe(FLOOR_ROWS.min);
  });
});
