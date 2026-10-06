import type { HabitId } from './habit';
import { resolveSpecies } from './plant/registry';

/** Standing plants per shelf. */
export const SLOTS_PER_SHELF = 3;
/** Shelves of standing plants on each wall. */
export const SHELVES_PER_WALL = 2;
/** Hanging spots in the top band: one beside the window on the first wall, three on the others. */
export const TOP_SLOTS_FIRST_WALL = 1;
export const TOP_SLOTS_PER_WALL = 3;

const STANDING_PER_WALL = SLOTS_PER_SHELF * SHELVES_PER_WALL;

export interface ShelfItem {
  id: HabitId;
  species: string;
  /** Instant, ISO 8601: older habits come first. */
  createdAt: string;
}

export type StandingSlot = { kind: 'plant'; id: HabitId } | { kind: 'new' } | { kind: 'empty' };

/**
 * One wall of the room, as wide as three plants. Only walls of plants exist
 * today; furniture, paintings or a decor wall will be new fields or a new
 * `kind`.
 */
export interface Wall {
  /** 0 for the first wall, the one the app opens on. */
  index: number;
  kind: 'plants';
  /** The first wall has the window in its top band. */
  window: boolean;
  /** Top band, for hanging plants, pot at the top. null = bare wall. */
  top: (HabitId | null)[];
  /** Shelves of standing plants, top to bottom. */
  shelves: StandingSlot[][];
}

export interface ShelfLayout {
  walls: Wall[];
}

function topSlotsOf(wall: number): number {
  return wall === 0 ? TOP_SLOTS_FIRST_WALL : TOP_SLOTS_PER_WALL;
}

/**
 * Places the habits on the walls. Hanging plants fill the top bands (beside
 * the window, then three per wall); standing plants fill two shelves of
 * three per wall, followed by the dotted pot that creates a habit. The two
 * families are placed independently, each oldest first, so adding one kind
 * never moves the other. There are as many walls as the larger family needs.
 */
export function arrangeShelf(items: readonly ShelfItem[]): ShelfLayout {
  const ordered = [...items].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  const hangs = (item: ShelfItem) => resolveSpecies(item.species).species.hanging;
  const hanging = ordered.filter(hangs).map((item) => item.id);
  const standing: StandingSlot[] = [
    ...ordered
      .filter((item) => !hangs(item))
      .map((item) => ({ kind: 'plant' as const, id: item.id })),
    { kind: 'new' },
  ];

  const hangingWalls =
    hanging.length <= TOP_SLOTS_FIRST_WALL
      ? 1
      : 1 + Math.ceil((hanging.length - TOP_SLOTS_FIRST_WALL) / TOP_SLOTS_PER_WALL);
  const count = Math.max(hangingWalls, Math.ceil(standing.length / STANDING_PER_WALL));

  const walls: Wall[] = [];
  let nextHanging = 0;
  for (let index = 0; index < count; index++) {
    const top = Array.from({ length: topSlotsOf(index) }, () => hanging[nextHanging++] ?? null);
    const shelves = Array.from({ length: SHELVES_PER_WALL }, (_, shelf) =>
      Array.from(
        { length: SLOTS_PER_SHELF },
        (_, slot): StandingSlot =>
          standing[index * STANDING_PER_WALL + shelf * SLOTS_PER_SHELF + slot] ?? { kind: 'empty' },
      ),
    );
    walls.push({ index, kind: 'plants', window: index === 0, top, shelves });
  }
  return { walls };
}
