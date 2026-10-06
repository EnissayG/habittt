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

  it('keeps one row out of two, from the bottom of the wall', () => {
    const height = 100;
    const rows = FLOOR_ROWS.max;
    // Column 40 marked on every row except one: the floor row mirroring it stays dark.
    const skipped = height - 1 - 2 * 10;
    const marks = Array.from({ length: height }, (_, y) => [40, y] as [number, number]).filter(
      ([, y]) => y !== skipped,
    );
    const floor = drawFloor({ room: room(170, height, marks), rows });
    for (let r = 0; FLOOR_TOP + r < rows; r++) {
      const fy = FLOOR_TOP + r;
      if (isSeam(floor, 40, fy)) continue;
      const source = height - 1 - 2 * r;
      expect(reflectedAt(floor, 40, fy)).toHaveLength(source >= 0 && source !== skipped ? 1 : 0);
    }
  });

  it('leaves out what is too high to fit in the floor', () => {
    const height = 200;
    const floor = drawFloor({
      room: room(170, height, [
        [40, 0],
        [40, height - 1],
      ]),
      rows: FLOOR_ROWS.min,
    });
    expect(rowsWithMark(floor)).toEqual([FLOOR_TOP]);
  });

  it('starts from the lowest row actually drawn on the wall', () => {
    // The bottom rows of the wall hold only text (names), not pixels.
    const floor = drawFloor({
      room: room(170, 100, [
        [40, 80],
        [40, 78],
      ]),
      rows: FLOOR_ROWS.max,
    });
    expect(rowsWithMark(floor)).toEqual([FLOOR_TOP, FLOOR_TOP + 1]);
  });

  it('is clearly visible under the baseboard, then fades in many steps', () => {
    const height = 140;
    const marks = Array.from({ length: height }, (_, y) => [7, y] as [number, number]);
    const floor = drawFloor({ room: room(170, height, marks), rows: FLOOR_ROWS.max });
    const alphas = rowsWithMark(floor).map((y) => reflectedAt(floor, 7, y)[0]!.alpha);
    expect(alphas[0]!).toBeGreaterThanOrEqual(0.45);
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]!).toBeLessThanOrEqual(alphas[i - 1]!);
    expect(alphas[alphas.length - 1]!).toBeLessThan(alphas[0]! / 4);
    expect(new Set(alphas).size).toBeGreaterThan(4);
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
