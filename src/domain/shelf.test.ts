import { arrangeShelf, type PlantsWall, type ShelfItem, type StandingSlot } from './shelf';

const item = (id: string, species: string, day: number): ShelfItem => ({
  id,
  species,
  createdAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
});

const plant = (id: string): StandingSlot => ({ kind: 'plant', id });
const NEW: StandingSlot = { kind: 'new' };
const EMPTY: StandingSlot = { kind: 'empty' };

const standing = (n: number, from = 1) =>
  Array.from({ length: n }, (_, i) => item(`s${i + from}`, 'cactus', i + from));
const hanging = (n: number, from = 1) =>
  Array.from({ length: n }, (_, i) => item(`h${i + from}`, i % 2 ? 'pearls' : 'pothos', i + from));

/** The walls of plants, without the decor wall. */
const plantWalls = (items: ShelfItem[]) =>
  arrangeShelf(items).walls.filter((wall): wall is PlantsWall => wall.kind === 'plants');

const BARE: StandingSlot[][] = [
  [EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY],
];

describe('arrangeShelf', () => {
  it('always has the window wall, a second wall of shelves and the decor wall', () => {
    expect(arrangeShelf([])).toEqual({
      walls: [
        {
          index: 0,
          kind: 'plants',
          window: true,
          painting: null,
          top: [null],
          shelves: [
            [NEW, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
          ],
        },
        {
          index: 1,
          kind: 'plants',
          window: false,
          painting: 'sunset',
          top: [null, null, null],
          shelves: BARE,
        },
        { index: 2, kind: 'decor' },
      ],
    });
  });

  it('keeps the decor wall last, after every wall of shelves', () => {
    for (const count of [0, 5, 6, 13, 20]) {
      const { walls } = arrangeShelf(standing(count));
      expect(walls.map((wall) => wall.kind).lastIndexOf('plants')).toBe(walls.length - 2);
      expect(walls[walls.length - 1]).toEqual({ index: walls.length - 1, kind: 'decor' });
      expect(walls.map((wall) => wall.index)).toEqual(walls.map((_, i) => i));
    }
  });

  it('hangs a painting in the top band of the other walls while no plant hangs there', () => {
    const walls = plantWalls([...hanging(2), ...standing(12, 10)]);
    expect(walls.map((wall) => wall.painting)).toEqual([null, null, 'leaf']);
    expect(plantWalls(standing(18)).map((wall) => wall.painting)).toEqual([
      null,
      'sunset',
      'leaf',
      'sunset',
    ]);
  });

  it('never puts a standing plant beside the window', () => {
    const [wall] = plantWalls(standing(2));
    expect(wall!.top).toEqual([null]);
    expect(wall!.shelves[0]).toEqual([plant('s1'), plant('s2'), NEW]);
  });

  it('puts the oldest hanging plant beside the window, the next ones on the next walls', () => {
    const walls = plantWalls(hanging(5));
    expect(walls.map((wall) => wall.top)).toEqual([['h1'], ['h2', 'h3', 'h4'], ['h5', null, null]]);
    expect(walls.map((wall) => wall.window)).toEqual([true, false, false]);
    expect(walls.map((wall) => wall.index)).toEqual([0, 1, 2]);
  });

  it('keeps the new pot on the first wall when hanging plants open more walls', () => {
    const walls = plantWalls(hanging(2));
    expect(walls[0]!.shelves[0]![0]).toEqual(NEW);
    expect(walls[1]!.shelves).toEqual(BARE);
  });

  it('fills two shelves of three per wall, oldest first, then the new pot', () => {
    const walls = plantWalls(standing(5));
    expect(walls).toHaveLength(2);
    expect(walls[1]!.shelves).toEqual(BARE);
    expect(walls[0]!.shelves).toEqual([
      [plant('s1'), plant('s2'), plant('s3')],
      [plant('s4'), plant('s5'), NEW],
    ]);
  });

  it('puts the new pot on the second wall when the first one is full', () => {
    const walls = plantWalls(standing(6));
    expect(walls).toHaveLength(2);
    expect(walls[1]!.top).toEqual([null, null, null]);
    expect(walls[1]!.shelves).toEqual([
      [NEW, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY],
    ]);
  });

  it('adds walls of shelves when the larger of the two families needs them', () => {
    expect(plantWalls([...hanging(4), ...standing(2, 10)])).toHaveLength(2);
    expect(plantWalls([...hanging(1), ...standing(12, 10)])).toHaveLength(3);
    expect(plantWalls([...hanging(8), ...standing(12, 10)])).toHaveLength(4);
  });

  it('never moves a standing plant when a hanging plant is added, and the other way round', () => {
    const base = [...hanging(2), ...standing(7, 10)];
    const before = plantWalls(base);
    const withHanging = plantWalls([...base, item('h9', 'pothos', 30)]);
    const withStanding = plantWalls([...base, item('s99', 'fern', 30)]);
    expect(withHanging.map((wall) => wall.shelves)).toEqual(before.map((wall) => wall.shelves));
    expect(withStanding.map((wall) => wall.top)).toEqual(before.map((wall) => wall.top));
  });

  it('sorts each family by creation, whatever the input order', () => {
    const walls = plantWalls([item('b', 'cactus', 2), item('a', 'monstera', 1)]);
    expect(walls[0]!.shelves[0]).toEqual([plant('a'), plant('b'), NEW]);
  });

  it('treats an unknown species as standing (its fallback plant)', () => {
    const walls = plantWalls([item('x', 'orchid-from-the-future', 1)]);
    expect(walls[0]!.top).toEqual([null]);
    expect(walls[0]!.shelves[0]![0]).toEqual(plant('x'));
  });
});
