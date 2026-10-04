import type { SceneryTone } from './grid';

// Pot and shelf, drawn under the plant on day 0. Dimensions are relative to
// the pot's anchor so they follow the grid if it grows.

export const POT_HEIGHT = 10;
/** Rows below the rim holding the shelf (inclusive). */
export const SHELF_ROWS = [POT_HEIGHT + 1, POT_HEIGHT + 3] as const;

/** Rows below the rim that the pot and shelf need, rim row included. */
export const SCENERY_DEPTH = SHELF_ROWS[1] + 1;

/** Pot half-width for each row below the rim (flared pot). */
export const POT_HALF_WIDTHS: readonly number[] = [7, 7, 6, 6, 6, 5, 5, 5, 4, 4];

export function paintScenery(
  set: (x: number, y: number, tone: SceneryTone) => void,
  anchorX: number,
  rimY: number,
  width: number,
): void {
  const top = POT_HALF_WIDTHS[0]!;
  for (let x = anchorX - top + 1; x <= anchorX + top - 1; x++) set(x, rimY, 'soil');

  POT_HALF_WIDTHS.forEach((half, i) => {
    for (let x = anchorX - half; x <= anchorX + half; x++) {
      // The right edge is shaded to give the pot some volume.
      set(x, rimY + 1 + i, x > anchorX + half - 3 ? 'potShade' : 'pot');
    }
  });

  for (let x = 0; x < width; x++) {
    set(x, rimY + SHELF_ROWS[0], 'shelf');
    set(x, rimY + SHELF_ROWS[0] + 1, 'shelf');
    set(x, rimY + SHELF_ROWS[1], 'shelfShade');
  }
}
