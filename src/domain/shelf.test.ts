import { arrangeShelf, type ShelfItem } from './shelf';

const item = (id: string, species: string, day: number): ShelfItem => ({
  id,
  species,
  createdAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
});

const plant = (id: string) => ({ kind: 'plant' as const, id });
const NEW = { kind: 'new' as const };

describe('arrangeShelf', () => {
  it('shows only the new-habit slot when there is no habit', () => {
    expect(arrangeShelf([])).toEqual({ windowSlot: null, hangingRows: [], shelves: [[NEW]] });
  });

  it('gives the window slot to the oldest hanging plant', () => {
    const layout = arrangeShelf([
      item('a', 'monstera', 1),
      item('b', 'pothos', 2),
      item('c', 'pearls', 3),
    ]);
    expect(layout.windowSlot).toBe('b');
    expect(layout.hangingRows).toEqual([['c']]);
    expect(layout.shelves).toEqual([[plant('a'), NEW]]);
  });

  it('gives the window slot to the oldest plant when none hangs', () => {
    const layout = arrangeShelf([item('b', 'cactus', 2), item('a', 'monstera', 1)]);
    expect(layout.windowSlot).toBe('a');
    expect(layout.hangingRows).toEqual([]);
    expect(layout.shelves).toEqual([[plant('b'), NEW]]);
  });

  it('puts other hanging plants in their own rows of three, never on shelves', () => {
    const layout = arrangeShelf([
      item('h1', 'pothos', 1),
      item('h2', 'pearls', 2),
      item('h3', 'pothos', 3),
      item('h4', 'pearls', 4),
      item('h5', 'pothos', 5),
      item('s1', 'fern', 6),
    ]);
    expect(layout.windowSlot).toBe('h1');
    expect(layout.hangingRows).toEqual([['h2', 'h3', 'h4'], ['h5']]);
    expect(layout.shelves).toEqual([[plant('s1'), NEW]]);
  });

  it('fills shelves three by three, oldest first, with the new slot last', () => {
    const layout = arrangeShelf(
      ['a', 'b', 'c', 'd', 'e'].map((id, i) => item(id, 'cactus', i + 1)),
    );
    expect(layout.windowSlot).toBe('a');
    expect(layout.shelves).toEqual([
      [plant('b'), plant('c'), plant('d')],
      [plant('e'), NEW],
    ]);
  });

  it('opens a new shelf for the new slot when the last one is full', () => {
    const layout = arrangeShelf(['a', 'b', 'c', 'd'].map((id, i) => item(id, 'cactus', i + 1)));
    expect(layout.shelves).toEqual([[plant('b'), plant('c'), plant('d')], [NEW]]);
  });

  it('treats an unknown species as standing (its fallback plant)', () => {
    const layout = arrangeShelf([item('a', 'cactus', 1), item('x', 'orchid-from-the-future', 2)]);
    expect(layout.hangingRows).toEqual([]);
    expect(layout.shelves).toEqual([[plant('x'), NEW]]);
  });
});
