import { drawFloor, FLOOR_ROWS, FLOOR_TOP } from './drawFloor';
import type { RoomImage, RoomSource } from './roomPlan';
import type { SceneImage } from './sceneImage';

const MARK: RoomSource = { kind: 'tone', tone: 'roof' };

/** A room of the given size with marks at some (x, y). */
function room(width: number, height: number, marks: [number, number][] = []): RoomImage {
  const pixels = new Array<RoomSource | null>(width * height).fill(null);
  for (const [x, y] of marks) pixels[y * width + x] = MARK;
  return { width, height, pixels };
}

const reflectedAt = (floor: SceneImage, x: number, y: number) =>
  floor.pixels[y * floor.width + x]?.layers.filter(
    (l) => l.source.kind === 'tone' && l.source.tone === 'roof',
  ) ?? [];

const isSeam = (floor: SceneImage, x: number, y: number) =>
  floor.pixels[y * floor.width + x]?.tone === 'seam';

/** Floor rows where a mark shows, top to bottom. */
const rowsWithMark = (floor: SceneImage) =>
  Array.from({ length: floor.height }, (_, y) => y).filter((y) =>
    Array.from({ length: floor.width }, (_, x) => x).some(
      (x) => reflectedAt(floor, x, y).length > 0,
    ),
  );

describe('drawFloor', () => {
  it('is as wide as the room and as tall as asked, with planks and seams', () => {
    const floor = drawFloor({ room: room(170, 100), rows: FLOOR_ROWS.max });
    expect(floor.width).toBe(170);
    expect(floor.height).toBe(FLOOR_ROWS.max);
    const tones = new Set(floor.pixels.map((p) => p?.tone));
    expect(tones.has('plank0')).toBe(true);
    expect(tones.has('seam')).toBe(true);
    expect(tones.has('wallLine')).toBe(true);
  });

  it('keeps its planks when it is shortened to the minimum', () => {
    const floor = drawFloor({ room: room(170, 100), rows: FLOOR_ROWS.min });
    expect(floor.height).toBe(FLOOR_ROWS.min);
    expect(floor.pixels.every((p) => p !== null)).toBe(true);
  });

  it('mirrors the bottom of the room just under the floor line, in the same column', () => {
    const floor = drawFloor({ room: room(170, 100, [[40, 99]]), rows: FLOOR_ROWS.max });
    const first = rowsWithMark(floor);
    expect(first[0]).toBe(FLOOR_TOP);
    expect(reflectedAt(floor, 40, FLOOR_TOP)).toHaveLength(1);
    expect(reflectedAt(floor, 39, FLOOR_TOP)).toHaveLength(0);
  });

  it('squeezes the whole wall into the floor by keeping one row out of n', () => {
    const height = 180;
    const rows = FLOOR_ROWS.max;
    const step = Math.ceil(height / (rows - FLOOR_TOP));
    expect(step).toBeGreaterThan(1);
    // Column 40 marked on every row except one sampled row: the floor row
    // that mirrors it stays dark, the others show a mark.
    const skipped = height - 1 - 10 * step;
    const marks = Array.from({ length: height }, (_, y) => [40, y] as [number, number]).filter(
      ([, y]) => y !== skipped,
    );
    const floor = drawFloor({ room: room(170, height, marks), rows });
    for (let r = 0; FLOOR_TOP + r < rows; r++) {
      const fy = FLOOR_TOP + r;
      if (isSeam(floor, 40, fy)) continue;
      const source = height - 1 - r * step;
      const expected = source >= 0 && source !== skipped ? 1 : 0;
      expect(reflectedAt(floor, 40, fy)).toHaveLength(expected);
    }
    // The deepest sampled row is within the wall's top step: the wall fits.
    const deepest = Math.floor((height - 1) / step);
    expect(FLOOR_TOP + deepest).toBeLessThan(rows);
  });

  it('reflects every row of a short wall', () => {
    const marks = Array.from({ length: 20 }, (_, y) => [10 + y, y] as [number, number]);
    const floor = drawFloor({ room: room(170, 20, marks), rows: FLOOR_ROWS.max });
    for (let y = 0; y < 20; y++) {
      const fy = FLOOR_TOP + (19 - y);
      if (!isSeam(floor, 10 + y, fy)) expect(reflectedAt(floor, 10 + y, fy)).toHaveLength(1);
    }
  });

  it('fades away from the wall, in a few steps only', () => {
    const height = 49;
    const marks: [number, number][] = [];
    for (let y = 0; y < height; y++) marks.push([7, y]);
    const floor = drawFloor({ room: room(170, height, marks), rows: FLOOR_ROWS.max });
    const alphas = rowsWithMark(floor).map((y) => reflectedAt(floor, 7, y)[0]!.alpha);
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]!).toBeLessThanOrEqual(alphas[i - 1]!);
    expect(alphas[alphas.length - 1]!).toBeLessThan(alphas[0]!);
    expect(new Set(alphas).size).toBeLessThanOrEqual(4);
  });

  it('lets the seams of the planks pass over the reflection', () => {
    const full = room(
      170,
      60,
      Array.from(
        { length: 170 * 60 },
        (_, i) => [i % 170, Math.floor(i / 170)] as [number, number],
      ),
    );
    const floor = drawFloor({ room: full, rows: FLOOR_ROWS.max });
    const seams = floor.pixels.filter((p) => p?.tone === 'seam');
    expect(seams.length).toBeGreaterThan(0);
    for (const seam of seams) expect(seam!.layers).toEqual([]);
  });

  it('reflects plant pixels and scene tones alike', () => {
    const plant: RoomSource = {
      kind: 'plant',
      pixel: { tone: 'leaf', day: 3, relapse: false },
      genome: { potColor: 0, potShape: 0, potPattern: 0, foliage: 0, mirror: false, trait: 'none' },
    } as unknown as RoomSource;
    const image = room(170, 10);
    (image.pixels as (RoomSource | null)[])[9 * 170 + 50] = plant;
    const floor = drawFloor({ room: image, rows: FLOOR_ROWS.max });
    expect(floor.pixels[FLOOR_TOP * 170 + 50]!.layers.at(-1)!.source).toBe(plant);
  });

  it('is deterministic', () => {
    const marks: [number, number][] = [
      [3, 4],
      [60, 30],
    ];
    expect(drawFloor({ room: room(170, 40, marks), rows: 40 })).toEqual(
      drawFloor({ room: room(170, 40, marks), rows: 40 }),
    );
  });
});
