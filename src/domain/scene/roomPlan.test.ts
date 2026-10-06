import { usedRows } from '../plant/bounds';
import { PLANT_GRID, type PlantImage } from '../plant/grid';
import { renderPlant } from '../plant/renderPlant';
import { arrangeShelf, type ShelfItem } from '../shelf';
import { drawWindow, WINDOW_SIZE } from './drawWindow';
import { composeRoom, planRoom, type PlacedItem, type RoomPlan } from './roomPlan';

const item = (id: string, species: string, day: number): ShelfItem => ({
  id,
  species,
  createdAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
});

const grown = (species: string, seed = 7) =>
  renderPlant({ species, seed, elapsedDays: 120, relapseDays: [] });

const window = drawWindow('day');
const GEOMETRY = { pageWidth: 160, labelRows: 10 };

function plan(items: ShelfItem[], images: Record<string, PlantImage>, geometry = GEOMETRY) {
  return planRoom({ layout: arrangeShelf(items), plants: images, window, ...geometry });
}

const plantsOf = (room: RoomPlan, wall: number) =>
  room.walls[wall]!.items.filter((placed) => placed.content.kind === 'plant');
const byId = (room: RoomPlan, id: string): PlacedItem =>
  room.walls
    .flatMap((wall) => wall.items)
    .find((placed) => placed.content.kind === 'plant' && placed.content.id === id)!;

describe('planRoom', () => {
  it('centers each wall in its page, on whole cells', () => {
    const room = plan(
      Array.from({ length: 6 }, (_, i) => item(`s${i}`, 'cactus', i + 1)),
      Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`s${i}`, grown('cactus')])),
      { pageWidth: 160.5, labelRows: 10 },
    );
    expect(room.walls.map((wall) => wall.left)).toEqual([8, 169]);
    expect(room.width).toBe(321);
  });

  it('puts the window in the top band of the first wall, beside its spot', () => {
    const room = plan([], {});
    const placed = room.walls[0]!.items.find((p) => p.content.kind === 'window')!;
    expect(placed.x).toBe(room.walls[0]!.left + PLANT_GRID.width);
    expect(placed.rows).toEqual({ from: 0, to: WINDOW_SIZE.height });
    expect(placed.labelled).toBe(false);
  });

  it('leaves the spot beside the window bare when no plant hangs', () => {
    const room = plan([item('a', 'cactus', 1)], { a: grown('cactus') });
    const wall = room.walls[0]!;
    const window = wall.items.find((p) => p.content.kind === 'window')!;
    expect(wall.items.filter((p) => p.y === window.y && p !== window)).toEqual([]);
  });

  it('hangs a plant beside the window from the top of its image, labelled', () => {
    const pothos = grown('pothos');
    const room = plan([item('h', 'pothos', 1)], { h: pothos });
    const placed = byId(room, 'h');
    expect(placed.rows.from).toBe(0);
    expect(placed.rows.to).toBe(Math.max(WINDOW_SIZE.height, usedRows(pothos).bottom + 1));
    expect(placed.labelled).toBe(true);
  });

  it('gives each shelf the height of its tallest plant, plus the labels', () => {
    const tall = grown('bamboo');
    const short = renderPlant({ species: 'cactus', seed: 7, elapsedDays: 3, relapseDays: [] });
    const room = plan([item('a', 'bamboo', 1), item('b', 'cactus', 2)], { a: tall, b: short });
    const [a, b] = [byId(room, 'a'), byId(room, 'b')];
    expect(a.y).toBe(b.y);
    expect(a.rows).toEqual({ from: usedRows(tall).top, to: PLANT_GRID.height });
    expect(b.rows).toEqual(a.rows);
    expect(a.x + PLANT_GRID.width).toBe(b.x);
  });

  it('stacks top band, shelf 1 and shelf 2, each followed by its labels', () => {
    const room = plan([], {});
    const wall = room.walls[0]!;
    const [band, shelf1, shelf2] = [...new Set(wall.items.map((p) => p.y))].map((y) =>
      wall.items.find((p) => p.y === y)!,
    );
    const height = (p: PlacedItem) => p.rows.to - p.rows.from;
    expect(shelf1!.y).toBe(band!.y + height(band!) + GEOMETRY.labelRows);
    expect(shelf2!.y).toBe(shelf1!.y + height(shelf1!) + GEOMETRY.labelRows);
    expect(shelf2!.y + height(shelf2!) + GEOMETRY.labelRows).toBe(room.height);
  });

  it('puts the dotted pot first on the shelf and bare shelves elsewhere', () => {
    const room = plan([], {});
    const slots = room.walls[0]!.items.filter((p) => p.content.kind === 'slot');
    expect(slots.map((p) => (p.content.kind === 'slot' ? p.content.slot : null))).toEqual([
      'new',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
    ]);
    expect(slots.map((p) => p.labelled)).toEqual([true, false, false, false, false, false]);
  });

  it('sits every wall on the same floor line, the tallest one setting it', () => {
    const items = [
      ...Array.from({ length: 6 }, (_, i) => item(`s${i}`, 'bamboo', i + 1)),
      item('h1', 'pothos', 20),
    ];
    const images = Object.fromEntries(items.map((it) => [it.id, grown(it.species)]));
    const room = plan(items, images);
    expect(room.walls).toHaveLength(2);
    for (const wall of room.walls) {
      const bottom = Math.max(...wall.items.map((p) => p.y + p.rows.to - p.rows.from));
      expect(bottom + GEOMETRY.labelRows).toBe(room.height);
    }
    expect(room.walls[1]!.height).toBeLessThan(room.walls[0]!.height);
  });

  it('shows a bare wall instead of an empty top band', () => {
    const items = Array.from({ length: 6 }, (_, i) => item(`s${i}`, 'cactus', i + 1));
    const images = Object.fromEntries(items.map((it) => [it.id, grown('cactus')]));
    const room = plan(items, images);
    expect(room.walls[1]!.items).toHaveLength(6);
    expect(plantsOf(room, 1)).toHaveLength(0);
  });

  it('fills a partial top band with bare hanging shelves', () => {
    const items = [item('h1', 'pothos', 1), item('h2', 'pearls', 2)];
    const room = plan(items, { h1: grown('pothos'), h2: grown('pearls') });
    const band = room.walls[1]!.items.filter((p) => p.y === byId(room, 'h2').y);
    expect(band.map((p) => p.content.kind)).toEqual(['plant', 'slot', 'slot']);
  });
});

describe('composeRoom', () => {
  it('copies every placed pixel at its place in the room, bottom-aligned walls included', () => {
    const cactus = grown('cactus');
    const room = plan([item('a', 'cactus', 1)], { a: cactus });
    const image = composeRoom(room);
    expect(image.width).toBe(room.width);
    expect(image.height).toBe(room.height);

    const placed = byId(room, 'a');
    for (let y = placed.rows.from; y < placed.rows.to; y++) {
      for (let x = 0; x < cactus.width; x++) {
        const pixel = cactus.pixels[y * cactus.width + x];
        const source = image.pixels[(placed.y + y - placed.rows.from) * image.width + placed.x + x];
        if (pixel) expect(source).toEqual({ kind: 'plant', pixel, genome: cactus.genome });
        else expect(source ?? null).toBeNull();
      }
    }
  });

  it('includes the window by its base tones', () => {
    const room = plan([], {});
    const image = composeRoom(room);
    const placed = room.walls[0]!.items.find((p) => p.content.kind === 'window')!;
    const tones = new Set(
      image.pixels
        .filter((_, i) => {
          const x = i % image.width;
          const y = Math.floor(i / image.width);
          return (
            x >= placed.x &&
            x < placed.x + WINDOW_SIZE.width &&
            y >= placed.y &&
            y < placed.y + WINDOW_SIZE.height
          );
        })
        .map((source) => (source?.kind === 'tone' ? source.tone : null)),
    );
    expect(tones.has('frame')).toBe(true);
    expect(tones.has('curtain')).toBe(true);
  });
});
