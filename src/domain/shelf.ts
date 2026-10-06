import type { HabitId } from './habit';
import { resolveSpecies } from './plant/registry';

/** Plants per shelf (and per hanging row). */
export const SLOTS_PER_SHELF = 3;

export interface ShelfItem {
  id: HabitId;
  species: string;
  /** Instant, ISO 8601: older habits come first. */
  createdAt: string;
}

export type ShelfSlot = { kind: 'plant'; id: HabitId } | { kind: 'new' };

export interface ShelfLayout {
  /** The plant next to the window (null when there is no habit). */
  windowSlot: HabitId | null;
  /** Rows of hanging plants just under the window row, pot at the top. */
  hangingRows: HabitId[][];
  /** Ordinary shelves; the last slot is the dotted pot that creates a habit. */
  shelves: ShelfSlot[][];
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/**
 * Places the habits on the shelf:
 * 1. the slot next to the window goes to the oldest hanging plant, or to the
 *    oldest plant if none hangs;
 * 2. the other hanging plants get their own rows under the window row (their
 *    vines would otherwise fall on the names and counters of a shelf);
 * 3. the other plants fill ordinary shelves, three per shelf, followed by the
 *    "new habit" slot.
 */
export function arrangeShelf(items: readonly ShelfItem[]): ShelfLayout {
  const ordered = [...items].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  const hangs = (item: ShelfItem) => resolveSpecies(item.species).species.hanging;

  const windowItem = ordered.find(hangs) ?? ordered[0];
  const others = ordered.filter((item) => item !== windowItem);

  return {
    windowSlot: windowItem?.id ?? null,
    hangingRows: chunk(
      others.filter(hangs).map((item) => item.id),
      SLOTS_PER_SHELF,
    ),
    shelves: chunk<ShelfSlot>(
      [
        ...others
          .filter((item) => !hangs(item))
          .map((item): ShelfSlot => ({ kind: 'plant', id: item.id })),
        { kind: 'new' },
      ],
      SLOTS_PER_SHELF,
    ),
  };
}
