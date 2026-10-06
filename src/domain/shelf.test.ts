import { arrangeShelf, type ShelfItem, type StandingSlot } from './shelf';

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

describe('arrangeShelf', () => {
  it('shows one wall with the window, an empty spot beside it and the new pot', () => {
    expect(arrangeShelf([])).toEqual({
      walls: [
        {
          index: 0,
          kind: 'plants',
          window: true,
          top: [null],
          shelves: [
            [NEW, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
          ],
        },
      ],
    });
  });

  it('never puts a standing plant beside the window', () => {
    const [wall] = arrangeShelf(standing(2)).walls;
    expect(wall!.top).toEqual([null]);
    expect(wall!.shelves[0]).toEqual([plant('s1'), plant('s2'), NEW]);
  });

  it('puts the oldest hanging plant beside the window, the next ones on the next walls', () => {
    const { walls } = arrangeShelf(hanging(5));
    expect(walls.map((wall) => wall.top)).toEqual([['h1'], ['h2', 'h3', 'h4'], ['h5', null, null]]);
    expect(walls.map((wall) => wall.window)).toEqual([true, false, false]);
    expect(walls.map((wall) => wall.index)).toEqual([0, 1, 2]);
  });

  it('keeps the new pot on the first wall when hanging plants open more walls', () => {
    const { walls } = arrangeShelf(hanging(2));
    expect(walls[0]!.shelves[0]![0]).toEqual(NEW);
    expect(walls[1]!.shelves).toEqual([
      [EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY],
    ]);
  });

  it('fills two shelves of three per wall, oldest first, then the new pot', () => {
    const { walls } = arrangeShelf(standing(5));
    expect(walls).toHaveLength(1);
    expect(walls[0]!.shelves).toEqual([
      [plant('s1'), plant('s2'), plant('s3')],
      [plant('s4'), plant('s5'), NEW],
    ]);
  });

  it('opens a new wall for the new pot when the last wall is full', () => {
    const { walls } = arrangeShelf(standing(6));
    expect(walls).toHaveLength(2);
    expect(walls[1]!.top).toEqual([null, null, null]);
    expect(walls[1]!.shelves).toEqual([
      [NEW, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY],
    ]);
  });

  it('opens as many walls as the larger of the two families needs', () => {
    expect(arrangeShelf([...hanging(4), ...standing(2, 10)]).walls).toHaveLength(2);
    expect(arrangeShelf([...hanging(1), ...standing(12, 10)]).walls).toHaveLength(3);
    expect(arrangeShelf([...hanging(8), ...standing(12, 10)]).walls).toHaveLength(4);
  });

  it('never moves a standing plant when a hanging plant is added, and the other way round', () => {
    const base = [...hanging(2), ...standing(7, 10)];
    const before = arrangeShelf(base).walls;
    const withHanging = arrangeShelf([...base, item('h9', 'pothos', 30)]).walls;
    const withStanding = arrangeShelf([...base, item('s99', 'fern', 30)]).walls;
    expect(withHanging.map((wall) => wall.shelves)).toEqual(before.map((wall) => wall.shelves));
    expect(withStanding.map((wall) => wall.top)).toEqual(before.map((wall) => wall.top));
  });

  it('sorts each family by creation, whatever the input order', () => {
    const { walls } = arrangeShelf([item('b', 'cactus', 2), item('a', 'monstera', 1)]);
    expect(walls[0]!.shelves[0]).toEqual([plant('a'), plant('b'), NEW]);
  });

  it('treats an unknown species as standing (its fallback plant)', () => {
    const { walls } = arrangeShelf([item('x', 'orchid-from-the-future', 1)]);
    expect(walls[0]!.top).toEqual([null]);
    expect(walls[0]!.shelves[0]![0]).toEqual(plant('x'));
  });
});
