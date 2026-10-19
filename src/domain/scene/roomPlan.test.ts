import { usedRows } from '../plant/bounds';
import { PLANT_GRID, type PlantImage } from '../plant/grid';
import { renderPlant } from '../plant/renderPlant';
import { arrangeShelf, type ShelfItem } from '../shelf';
import {
  CEILING_ROWS,
  CUSHION_SIZE,
  drawSign,
  SIGN_SIZE,
  drawCushion,
  drawLowTable,
  drawMat,
  drawVase,
  drawWallShelf,
  EMBER,
  FLAME,
  LOW_TABLE_SIZE,
  SMOKE_SIZE,
  VASE_SIZE,
  WALL_SHELF_SIZE,
} from './drawCorner';
import { drawLantern, drawPainting, drawScroll, LANTERN_SIZE, SCROLL_SIZE } from './drawDecor';
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
    expect(painting.y).toBe(CEILING_ROWS + 1);
    expect(painting.labelled).toBe(false);
  });

  it('hangs nothing over the string of lights, except the cord of the lantern', () => {
    const items = [
      item('h1', 'pothos', 1),
      ...Array.from({ length: 6 }, (_, i) => item(`s${i}`, 'cactus', i + 2)),
    ];
    const images = Object.fromEntries(
      items.map((it) => [it.id, grown(it.id === 'h1' ? 'pothos' : 'cactus')]),
    );
    const room = plan(items, images);
    for (const wall of room.walls) {
      for (const placed of wall.items) {
        if (placed.content.kind === 'decor' && placed.content.piece === 'lantern') continue;
        expect(placed.y).toBeGreaterThanOrEqual(CEILING_ROWS);
      }
    }
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
  const pieces = (room: RoomPlan, w = room.walls.length - 1) =>
    room.walls[w]!.items.flatMap((p) => (p.content.kind === 'decor' ? [p.content.piece] : []));
  const piece = (room: RoomPlan, name: string) =>
    room.walls[room.walls.length - 1]!.items.find(
      (p) => p.content.kind === 'decor' && p.content.piece === name,
    )!;

  it('furnishes the last wall as the meditation corner, with no shelf', () => {
    const room = tallRoom();
    const wall = room.walls[2]!;
    expect(wall.wall.kind).toBe('decor');
    expect(pieces(room)).toEqual([
      'painting',
      'wallShelf',
      'scroll',
      'lantern',
      'cushion',
      'sign',
      'lowTable',
      'vase',
    ]);
    // The sign of the meditation, over the cushion, never on the wall shelf.
    const sign = piece(room, 'sign');
    expect(sign.content.image).toEqual(drawSign());
    expect(sign.y + SIGN_SIZE.height).toBe(room.height - CUSHION_SIZE.height - 2);
    expect(sign.x + SIGN_SIZE.width / 2).toBe(wall.left + 20 + CUSHION_SIZE.width / 2);
    expect(sign.y).toBeGreaterThan(piece(room, 'wallShelf').y + WALL_SHELF_SIZE.height);
    // What stands, on the floor line, left to right.
    const standing: [string, unknown, number, number][] = [
      ['cushion', drawCushion(), 20, CUSHION_SIZE.height],
      ['lowTable', drawLowTable(), 70, LOW_TABLE_SIZE.height],
      ['vase', drawVase(), 122, VASE_SIZE.height],
    ];
    for (const [name, image, x, height] of standing) {
      const placed = piece(room, name);
      expect(placed.content.image).toEqual(image);
      expect(placed.x).toBe(wall.left + x);
      expect(placed.y + height).toBe(room.height);
    }
    // What hangs, at its own height.
    expect(piece(room, 'painting').content.image).toEqual(drawPainting('peaks'));
    expect(piece(room, 'painting').y).toBe(room.height - 90);
    expect(piece(room, 'wallShelf').content.image).toEqual(drawWallShelf());
    expect(piece(room, 'wallShelf').y).toBe(room.height - 48);
    expect(piece(room, 'scroll').content.image).toEqual(drawScroll());
    expect(piece(room, 'scroll').y).toBe(room.height - 104);
    const lantern = piece(room, 'lantern');
    expect(lantern.y).toBe(0);
    expect(lantern.content.image).toEqual(drawLantern(room.height - 120 - LANTERN_SIZE.height));
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
    ['a medium room', () => plan([], {}, { pageWidth: 150, labelRows: 16 })],
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
    // The smoke rises over the table: nothing hangs in its way.
    const smoke = room.animated.find((a) => a.kind === 'smoke')!;
    boxes.push({
      piece: 'smoke',
      left: smoke.x,
      right: smoke.x + SMOKE_SIZE.width,
      top: smoke.y,
      bottom: smoke.y + SMOKE_SIZE.height,
    });
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(wall.left);
      expect(box.right).toBeLessThanOrEqual(wall.left + 144);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(room.height);
    }
    boxes.forEach((a, i) =>
      boxes.slice(i + 1).forEach((b) => {
        // The smoke rises from the table it belongs to.
        if ([a.piece, b.piece].sort().join() === 'lowTable,smoke') return;
        const apart =
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        expect([a.piece, b.piece, apart]).toEqual([a.piece, b.piece, true]);
      }),
    );
  });

  it('keeps the wall free above the cushion for the button of the corner', () => {
    for (const room of [
      tallRoom(),
      plan([], {}),
      plan([], {}, { pageWidth: 150, labelRows: 16 }),
    ]) {
      const shelf = room.walls[2]!.items.find(
        (p) => p.content.kind === 'decor' && p.content.piece === 'wallShelf',
      );
      if (shelf) {
        expect(shelf.y + WALL_SHELF_SIZE.height).toBeLessThanOrEqual(
          room.height - CUSHION_SIZE.height - 18,
        );
      }
    }
  });

  it('leaves out what cannot hang in a low room, never the furniture', () => {
    const low = plan([], {}, { pageWidth: 150, labelRows: 6 });
    expect(pieces(low)).toEqual(expect.arrayContaining(['cushion', 'lowTable', 'vase']));
    expect(pieces(low)).not.toContain('lantern');
    expect(pieces(tallRoom())).toContain('scroll');
    expect(low.height).toBeLessThan(56 + SCROLL_SIZE.height);
    expect(pieces(low)).not.toContain('scroll');
  });

  it('names each piece of decor; the sign, the cushion, the table and the scroll open the corner', () => {
    const all = tallRoom().walls.flatMap((_, w) => pieces(tallRoom(), w));
    expect(MEDITATION_PIECES).toEqual(['sign', 'cushion', 'lowTable', 'scroll']);
    for (const name of MEDITATION_PIECES) expect(all.filter((p) => p === name)).toHaveLength(1);
  });

  it('lays the mat on the floor, under the cushion', () => {
    const room = tallRoom();
    const wall = room.walls[2]!;
    expect(room.floorItems).toEqual([{ x: wall.left + 3, y: 2, image: drawMat() }]);
    const cushion = piece(room, 'cushion');
    const middle = cushion.x + CUSHION_SIZE.width / 2;
    expect(Math.abs(wall.left + 3 + drawMat().width / 2 - middle)).toBeLessThanOrEqual(1);
  });

  it('says where the smoke rises and the flame burns, on the table', () => {
    const room = tallRoom();
    const table = piece(room, 'lowTable');
    expect(room.animated).toEqual([
      {
        kind: 'smoke',
        x: table.x + EMBER.x - Math.floor(SMOKE_SIZE.width / 2),
        y: table.y + EMBER.y - SMOKE_SIZE.height,
      },
      { kind: 'flame', x: table.x + FLAME.x, y: table.y + FLAME.y },
    ]);
    expect(plan([], {}).animated).toHaveLength(2);
  });

  it('is always tall enough for the vase', () => {
    expect(plan([], {}).height).toBeGreaterThanOrEqual(VASE_SIZE.height);
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
    expect(tones.has('cushion')).toBe(true);
    expect(tones.has('stone')).toBe(true);
    expect(tones.has('vase')).toBe(true);
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
