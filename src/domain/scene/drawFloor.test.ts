import { drawRug } from './drawDecor';
import {
  drawFloor,
  drawFloorBoards,
  drawFloorItems,
  FLOOR_ROWS,
  FLOOR_TOP,
  mirrorRows,
  REFLECTION,
} from './drawFloor';
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

/** Every cell of the given rows, marked. */
const fullRows = (width: number, rows: number[]) =>
  rows.flatMap((y) => Array.from({ length: width }, (_, x) => [x, y] as [number, number]));

const range = (length: number) => Array.from({ length }, (_, i) => i);

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

  it('is a true mirror: one row of floor per row of wall, from the bottom of the wall', () => {
    const height = 100;
    const rows = FLOOR_ROWS.max;
    // Every row marked across the room but one: the floor row mirroring it stays dark.
    const skipped = height - 1 - 10;
    const marked = range(height).filter((y) => y !== skipped);
    const floor = drawFloor({ room: room(170, height, fullRows(170, marked)), rows });
    expect(rowsWithMark(floor)).toEqual(
      range(rows - FLOOR_TOP)
        .filter((r) => r !== 10)
        .map((r) => FLOOR_TOP + r),
    );
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
    expect(rowsWithMark(floor)).toEqual([FLOOR_TOP, FLOOR_TOP + 2]);
  });

  it('is clearly visible under the baseboard, then fades away smoothly', () => {
    const height = 140;
    const floor = drawFloor({
      room: room(170, height, fullRows(170, range(height))),
      rows: FLOOR_ROWS.max,
    });
    const alphas = rowsWithMark(floor).map((y) => reflectedAt(floor, 7, y)[0]!.alpha);
    expect(alphas).toHaveLength(FLOOR_ROWS.max - FLOOR_TOP);
    expect(alphas[0]).toBe(REFLECTION.object);
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]!).toBeLessThan(alphas[i - 1]!);
    expect(alphas[alphas.length - 1]!).toBeLessThan(alphas[0]! / 20);
  });

  it('hardly shows the bare wall, and fades it the same way', () => {
    const floor = drawFloor({ room: room(170, 100, [[40, 99]]), rows: FLOOR_ROWS.max });
    const wallAt = (y: number) =>
      floor.pixels[y * 170 + 100]!.layers.filter(
        (l) => l.source.kind === 'tone' && l.source.tone === 'wall',
      );
    expect(wallAt(FLOOR_TOP)).toEqual([
      { alpha: REFLECTION.wall, source: { kind: 'tone', tone: 'wall' } },
    ]);
    expect(wallAt(FLOOR_ROWS.max - 1)[0]!.alpha).toBeLessThan(REFLECTION.wall / 20);
    // Where something stands, the wall is not added behind it.
    expect(floor.pixels[FLOOR_TOP * 170 + 40]!.layers.at(-1)!.source).toBe(MARK);
    expect(
      floor.pixels[FLOOR_TOP * 170 + 40]!.layers.filter(
        (l) => l.source.kind === 'tone' && l.source.tone === 'wall',
      ),
    ).toEqual([]);
  });

  it('mirrors nothing when the room is empty', () => {
    const floor = drawFloor({ room: room(170, 100), rows: FLOOR_ROWS.max });
    expect(floor).toEqual(drawFloorBoards(170, FLOOR_ROWS.max));
  });

  it('lays the reflection over the planks and over their seams alike', () => {
    const width = 170;
    const floor = drawFloor({
      room: room(width, 100, fullRows(width, range(100))),
      rows: FLOOR_ROWS.max,
    });
    const boards = drawFloorBoards(width, FLOOR_ROWS.max);
    expect(boards.pixels.some((p) => p?.tone === 'seam')).toBe(true);
    floor.pixels.forEach((pixel, i) => {
      expect(pixel!.tone).toBe(boards.pixels[i]!.tone);
      const mirrored = Math.floor(i / width) >= FLOOR_TOP;
      expect(pixel!.layers.length).toBe(boards.pixels[i]!.layers.length + (mirrored ? 1 : 0));
    });
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

  it('lays the rug over the planks, the reflection and the seams, opaque', () => {
    const rug = drawRug();
    const full = room(
      170,
      60,
      Array.from(
        { length: 170 * 60 },
        (_, i) => [i % 170, Math.floor(i / 170)] as [number, number],
      ),
    );
    const floor = drawFloor({
      room: full,
      rows: FLOOR_ROWS.min,
      items: [{ x: 20, y: 2, image: rug }],
    });
    for (let y = 0; y < rug.height; y++) {
      for (let x = 0; x < rug.width; x++) {
        const below = floor.pixels[(2 + y) * 170 + 20 + x]!;
        const pixel = rug.pixels[y * rug.width + x];
        if (pixel) expect(below).toEqual(pixel);
        else expect(below.tone).not.toMatch(/^rug/);
      }
    }
  });

  it('cuts what lies past the edges of the floor', () => {
    const rug = drawRug();
    const floor = drawFloor({ room: room(50, 10), rows: 8, items: [{ x: 10, y: 4, image: rug }] });
    expect(floor.width).toBe(50);
    expect(floor.height).toBe(8);
    expect(floor.pixels.some((p) => p?.tone === 'rugA' || p?.tone === 'rugB')).toBe(true);
  });

  it('draws the rug alone exactly where the whole floor has it', () => {
    const rug = drawRug();
    const items = [{ x: 20, y: 2, image: rug }];
    const alone = drawFloorItems(170, FLOOR_ROWS.min, items);
    const whole = drawFloor({ room: room(170, 60), rows: FLOOR_ROWS.min, items });
    const boards = drawFloorBoards(170, FLOOR_ROWS.min);
    expect(alone.pixels.filter((p) => p !== null)).toHaveLength(
      rug.pixels.filter((p) => p !== null).length,
    );
    whole.pixels.forEach((pixel, i) => expect(pixel).toEqual(alone.pixels[i] ?? boards.pixels[i]));
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

  it('keeps still and straight: every column of the floor mirrors the column above it', () => {
    const marks: [number, number][] = [
      [0, 99],
      [60, 80],
      [61, 60],
      [169, 45],
    ];
    const floor = drawFloor({ room: room(170, 100, marks), rows: FLOOR_ROWS.max });
    for (const [x, y] of marks) {
      const fy = FLOOR_TOP + (99 - y);
      for (let fx = 0; fx < 170; fx++) {
        expect(reflectedAt(floor, fx, fy)).toHaveLength(fx === x ? 1 : 0);
      }
    }
  });
});

describe('mirrorRows', () => {
  const full = room(60, 100, fullRows(60, range(100)));

  it('gives one row of the room to each row of the floor, top to bottom', () => {
    const rows = mirrorRows(full, FLOOR_ROWS.max);
    expect(rows.map((row) => row.y)).toEqual(
      range(FLOOR_ROWS.max - FLOOR_TOP).map((r) => FLOOR_TOP + r),
    );
    expect(rows.map((row) => row.source)).toEqual(
      range(FLOOR_ROWS.max - FLOOR_TOP).map((r) => 99 - r),
    );
    expect(rows[0]!.fade).toBe(1);
  });

  it('stops where the room does', () => {
    const low = room(60, 10, fullRows(60, range(10)));
    expect(mirrorRows(low, FLOOR_ROWS.max).map((row) => row.source)).toEqual(range(10).reverse());
    expect(mirrorRows(room(60, 10), FLOOR_ROWS.max)).toEqual([]);
  });

  it('fades from the wall to the bottom edge, never to nothing', () => {
    const fades = mirrorRows(full, FLOOR_ROWS.max).map((row) => row.fade);
    for (let i = 1; i < fades.length; i++) expect(fades[i]!).toBeLessThan(fades[i - 1]!);
    expect(fades[fades.length - 1]!).toBeGreaterThan(0);
  });
});
