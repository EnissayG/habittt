import { usedRows } from '../plant/bounds';
import { PLANT_GRID, type PlantImage } from '../plant/grid';
import { renderPlant } from '../plant/renderPlant';
import { arrangeShelf, type ShelfItem } from '../shelf';
import {
  ALTAR_SIZE,
  ARMCHAIR_SIZE,
  drawAltar,
  drawArmchair,
  drawFloorLamp,
  drawLantern,
  drawPainting,
  drawRug,
  drawScroll,
  FLOOR_LAMP_SIZE,
  LANTERN_SIZE,
} from './drawDecor';
import { drawWindow, WINDOW_SIZE } from './drawWindow';
import {
  composeRoom,
  MEDITATION_PIECES,
  planRoom,
  type PlacedItem,
  type RoomPlan,
} from './roomPlan';

const item = (id: string, species: string, day: number): ShelfItem => ({
  id,
  species,
  createdAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
});

const grown = (species: string, seed = 7) =>
  renderPlant({ species, seed, elapsedDays: 120, relapseDays: [] });

const window = drawWindow('day');
const GEOMETRY = { pageWidth: 160, labelRows: 10 };

function plan(
  items: ShelfItem[],
  images: Record<string, PlantImage>,
  geometry: { pageWidth: number; labelRows: number; rowGap?: number } = GEOMETRY,
) {
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
    expect(room.walls.map((wall) => wall.left)).toEqual([8, 169, 329]);
    expect(room.width).toBe(482);
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

  it('lines rows up from one wall to the next, the tallest content setting each row', () => {
    const items = [
      ...Array.from({ length: 6 }, (_, i) => item(`s${i}`, 'bamboo', i + 1)),
      item('h1', 'pothos', 20),
    ];
    const images = Object.fromEntries(items.map((it) => [it.id, grown(it.species)]));
    const room = plan(items, images);
    expect(room.walls).toHaveLength(3);
    for (const wall of room.walls.slice(0, 2)) {
      const bottom = Math.max(...wall.items.map((p) => p.y + p.rows.to - p.rows.from));
      expect(bottom + GEOMETRY.labelRows).toBe(room.height);
    }
    expect(room.walls[1]!.height).toBe(room.walls[0]!.height);
    // The short dotted pot of wall 2 stands on the same shelf line as the bamboos.
    const pot = room.walls[1]!.items.find(
      (p) => p.content.kind === 'slot' && p.content.slot === 'new',
    )!;
    expect(pot.y).toBe(byId(room, 's0').y);
    expect(pot.rows).toEqual(byId(room, 's0').rows);
  });

  it('adds the same gap between rows, none under the last one', () => {
    const tight = plan([], {});
    const spread = plan([], {}, { ...GEOMETRY, rowGap: 5 });
    expect(spread.height).toBe(tight.height + 2 * 5);
    const ys = (room: RoomPlan) => [...new Set(room.walls[0]!.items.map((p) => p.y))];
    expect(ys(spread)).toEqual(ys(tight).map((y, i) => y + i * 5));
  });

  it('shows a bare wall with a painting instead of an empty top band', () => {
    const items = Array.from({ length: 6 }, (_, i) => item(`s${i}`, 'cactus', i + 1));
    const images = Object.fromEntries(items.map((it) => [it.id, grown('cactus')]));
    const room = plan(items, images);
    const wall = room.walls[1]!;
    expect(wall.items).toHaveLength(7);
    expect(plantsOf(room, 1)).toHaveLength(0);
    const painting = wall.items.find((p) => p.content.kind === 'decor')!;
    expect(painting.content.image).toEqual(drawPainting('sea'));
    expect(painting.x).toBe(wall.left + 8);
    expect(painting.y).toBe(4);
    expect(painting.labelled).toBe(false);
  });

  it('takes the painting down as soon as a plant hangs on that wall', () => {
    const items = [item('h1', 'pothos', 1), item('h2', 'pearls', 2)];
    const room = plan(items, { h1: grown('pothos'), h2: grown('pearls') });
    expect(room.walls[1]!.items.some((p) => p.content.kind === 'decor')).toBe(false);
  });

  /** A room as tall as a few grown plants make it. */
  const tallRoom = () =>
    plan(
      ['monstera', 'ficus', 'bamboo', 'fern'].map((species, i) => item(`t${i}`, species, i + 1)),
      Object.fromEntries(
        ['monstera', 'ficus', 'bamboo', 'fern'].map((species, i) => [`t${i}`, grown(species)]),
      ),
    );

  it('furnishes the last wall as the meditation corner, with no shelf', () => {
    const room = tallRoom();
    const wall = room.walls[2]!;
    expect(wall.wall.kind).toBe('decor');
    expect(wall.items.map((p) => p.content.kind)).toEqual(Array(6).fill('decor'));
    const [painting, scroll, lantern, armchair, altar, lamp] = wall.items;
    // What stands, on the floor line, left to right.
    expect(armchair!.content.image).toEqual(drawArmchair());
    expect(armchair!.x).toBe(wall.left + 14);
    expect(armchair!.y + ARMCHAIR_SIZE.height).toBe(room.height);
    expect(altar!.content.image).toEqual(drawAltar());
    expect(altar!.x).toBe(wall.left + 78);
    expect(altar!.y + ALTAR_SIZE.height).toBe(room.height);
    expect(lamp!.content.image).toEqual(drawFloorLamp());
    expect(lamp!.x).toBe(wall.left + 127);
    expect(lamp!.y + FLOOR_LAMP_SIZE.height).toBe(room.height);
    // What hangs: the painting over the armchair, the scroll over the table.
    expect(painting!.content.image).toEqual(drawPainting('peaks'));
    expect(painting!.x).toBe(wall.left + 22);
    expect(painting!.y).toBe(room.height - 118);
    expect(scroll!.content.image).toEqual(drawScroll());
    expect(scroll!.x).toBe(wall.left + 86);
    expect(scroll!.y).toBe(room.height - 124);
    // The lantern hangs from the ceiling down to above the two frames.
    expect(lantern!.y).toBe(0);
    expect(lantern!.x).toBe(wall.left + 63);
    expect(lantern!.content.image).toEqual(drawLantern(room.height - 134 - LANTERN_SIZE.height));
    expect(lantern!.content.image.height).toBe(room.height - 134);
    for (const placed of wall.items) {
      expect(placed.rows).toEqual({ from: 0, to: placed.content.image.height });
      expect(placed.labelled).toBe(false);
    }
  });

  it.each([
    ['a tall room', () => tallRoom()],
    [
      'the lowest room: no plant yet, small labels',
      () => plan([], {}, { pageWidth: 150, labelRows: 6 }),
    ],
    ['a low room', () => plan([], {})],
    [
      'a room just under the height the scroll needs',
      () => plan([], {}, { pageWidth: 150, labelRows: 13 }),
    ],
  ] as const)('%s: keeps every piece inside its wall, and none over another', (_, make) => {
    const room = make();
    const wall = room.walls[2]!;
    const boxes = wall.items.map((p) => ({
      piece: p.content.kind === 'decor' ? p.content.piece : '',
      left: p.x,
      right: p.x + p.content.image.width,
      top: p.y,
      bottom: p.y + p.content.image.height,
    }));
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(wall.left);
      expect(box.right).toBeLessThanOrEqual(wall.left + 144);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(room.height);
    }
    boxes.forEach((a, i) =>
      boxes.slice(i + 1).forEach((b) => {
        const apart =
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        expect([a.piece, b.piece, apart]).toEqual([a.piece, b.piece, true]);
      }),
    );
  });

  it('leaves out what cannot hang in a low room, never the furniture', () => {
    const pieces = (room: RoomPlan) =>
      room.walls[2]!.items.flatMap((p) => (p.content.kind === 'decor' ? [p.content.piece] : []));
    const low = plan([], {}, { pageWidth: 150, labelRows: 6 });
    expect(low.height).toBeLessThan(ALTAR_SIZE.height + 2 + 46);
    expect(pieces(low)).toEqual(expect.arrayContaining(['armchair', 'altar', 'lamp']));
    expect(pieces(low)).not.toContain('scroll');
    expect(pieces(low)).not.toContain('lantern');
    expect(pieces(tallRoom())).toContain('scroll');
    expect(pieces(low)).not.toContain('painting');
    // A little taller: the painting hangs under the ceiling, and the wall
    // stays free above the armchair for the button of the corner.
    const medium = plan([], {}, { pageWidth: 150, labelRows: 16 });
    const painting = medium.walls[2]!.items.find(
      (p) => p.content.kind === 'decor' && p.content.piece === 'painting',
    )!;
    expect(medium.height).toBeLessThan(118);
    expect(medium.height).toBeGreaterThanOrEqual(ARMCHAIR_SIZE.height + 18 + 30);
    expect(painting.y).toBe(0);
    expect(painting.y + painting.content.image.height).toBeLessThanOrEqual(
      medium.height - ARMCHAIR_SIZE.height - 18,
    );
  });

  it('names each piece of decor, so the meditation corner can be touched', () => {
    const room = tallRoom();
    const pieces = (w: number) =>
      room.walls[w]!.items.flatMap((p) => (p.content.kind === 'decor' ? [p.content.piece] : []));
    expect(pieces(2)).toEqual(['painting', 'scroll', 'lantern', 'armchair', 'altar', 'lamp']);
    const all = room.walls.flatMap((_, w) => pieces(w));
    for (const piece of MEDITATION_PIECES) {
      expect(all.filter((p) => p === piece)).toHaveLength(1);
    }
  });

  it('lays the rug on the floor in front of the armchair', () => {
    const room = plan([], {});
    const wall = room.walls[2]!;
    expect(room.floorItems).toEqual([{ x: wall.left, y: 2, image: drawRug() }]);
  });

  it('is always tall enough for the floor lamp', () => {
    const room = plan([], {}, { pageWidth: 160, labelRows: 0 });
    expect(room.height).toBeGreaterThanOrEqual(FLOOR_LAMP_SIZE.height);
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

  it('includes the furniture, so that the floor mirrors it', () => {
    const image = composeRoom(plan([], {}));
    const tones = new Set(
      image.pixels.map((source) => (source?.kind === 'tone' ? source.tone : null)),
    );
    expect(tones.has('chair')).toBe(true);
    expect(tones.has('lampShade')).toBe(true);
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
