import {
  arrangeShelf,
  composeRoom,
  drawFloor,
  drawFloorBoards,
  drawWindow,
  planRoom,
  renderPlant,
  FLOOR_ROWS,
  FLOOR_TOP,
  mirrorRows,
  REFLECTION,
  type RoomImage,
  type RoomSource,
} from '../../domain';
import { roomColor, sceneColor } from '../theme/scenePalette';
import { floorMirror } from './floorMirror';

const MARK: RoomSource = { kind: 'tone', tone: 'roof' };
const WIDTH = 40;
const HEIGHT = 100;

function room(marks: [number, number][]): RoomImage {
  const pixels = new Array<RoomSource | null>(WIDTH * HEIGHT).fill(null);
  for (const [x, y] of marks) pixels[y * WIDTH + x] = MARK;
  return { width: WIDTH, height: HEIGHT, pixels };
}

const colorOf = (source: RoomSource | null) => (source ? '#FF8000' : '#FDF6E3');
const rows = FLOOR_ROWS.max;

describe('floorMirror', () => {
  // The bottom row marked from the left edge to the middle.
  const marks = Array.from({ length: 20 }, (_, x) => [x, HEIGHT - 1] as [number, number]);
  const mirror = floorMirror(room(marks), rows, colorOf);
  const rgba = (x: number, y: number) =>
    Array.from(mirror.bytes.slice((y * mirror.width + x) * 4, (y * mirror.width + x) * 4 + 4));

  it('has one row per floor row and one column per column of the room', () => {
    expect(mirror.width).toBe(WIDTH);
    expect(mirror.height).toBe(rows);
    expect(mirror.bytes).toHaveLength(mirror.width * rows * 4);
  });

  it('stays transparent above the first plank', () => {
    for (let y = 0; y < FLOOR_TOP; y++) {
      for (let x = 0; x < mirror.width; x++) expect(rgba(x, y)).toEqual([0, 0, 0, 0]);
    }
  });

  it('gives what stands in the room its color, premultiplied by its opacity', () => {
    const a = REFLECTION.object;
    expect(rgba(5, FLOOR_TOP)).toEqual([
      Math.round(255 * a),
      Math.round(128 * a),
      0,
      Math.round(255 * a),
    ]);
  });

  it('gives the bare wall its color, much fainter', () => {
    const a = REFLECTION.wall;
    expect(rgba(30, FLOOR_TOP)).toEqual([
      Math.round(0xfd * a),
      Math.round(0xf6 * a),
      Math.round(0xe3 * a),
      Math.round(255 * a),
    ]);
  });

  it('fades each row like the floor of the domain', () => {
    const wall = floorMirror(room([[0, HEIGHT - 1]]), rows, colorOf);
    for (const { y, fade } of mirrorRows(room([[0, HEIGHT - 1]]), rows)) {
      const alpha = wall.bytes[(y * wall.width + 30) * 4 + 3];
      expect(alpha).toBe(Math.round(255 * REFLECTION.wall * fade));
    }
  });

  it('reads each color once, however large the room', () => {
    const seen: (RoomSource | null)[] = [];
    floorMirror(room(marks), rows, (source) => {
      seen.push(source);
      return colorOf(source);
    });
    expect(seen).toHaveLength(2);
  });

  it('is empty for an empty room', () => {
    expect(floorMirror(room([]), rows, colorOf).bytes.every((byte) => byte === 0)).toBe(true);
  });
});

describe('the reflection of the shelf, as an image', () => {
  // A real room: plants (one of them dead), the window, the decor wall.
  const species = ['bonsai', 'monstera', 'cactus', 'sansevieria', 'pothos'];
  const habits = species.map((id, i) => ({
    id: `h${i}`,
    species: id,
    createdAt: `2026-01-0${i + 1}`,
  }));
  const plants = Object.fromEntries(
    habits.map((habit, i) => [
      habit.id,
      renderPlant({
        species: habit.species,
        seed: 12 + i * 37,
        elapsedDays: 40 + i * 9,
        relapseDays: [],
        dead: i === 2,
      }),
    ]),
  );
  const plan = planRoom({
    layout: arrangeShelf(habits),
    plants,
    window: drawWindow('evening'),
    pageWidth: 150,
    labelRows: 14,
  });
  const real = composeRoom(plan);
  const floorRows = 60;
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  it('laid over the boards, shows the floor of the domain', () => {
    const mirror = floorMirror(real, floorRows, (source) => roomColor(source, 'evening'));
    const boards = drawFloorBoards(real.width, floorRows);
    const whole = drawFloor({ room: real, rows: floorRows });
    let worst = 0;
    for (let i = 0; i < real.width * floorRows; i++) {
      // What Skia does: the image drawn source-over, premultiplied.
      const alpha = mirror.bytes[i * 4 + 3]! / 255;
      const below = rgb(sceneColor(boards.pixels[i]!, 'evening'));
      const expected = rgb(sceneColor(whole.pixels[i]!, 'evening'));
      for (let k = 0; k < 3; k++) {
        const drawn = mirror.bytes[i * 4 + k]! + below[k]! * (1 - alpha);
        worst = Math.max(worst, Math.abs(drawn - expected[k]!));
      }
    }
    // Rounding only: a level or two out of 255.
    expect(worst).toBeLessThanOrEqual(2);
  });
});
