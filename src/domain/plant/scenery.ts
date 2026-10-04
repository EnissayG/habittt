import type { SceneryTone } from './grid';

// Pot and shelf, drawn under the plant on day 0. Dimensions are relative to
// the pot's anchor so they follow the grid if it grows.

const POT_HEIGHT = 10;
const SHELF_OFFSET = POT_HEIGHT + 1;
const SHELF_THICKNESS = 3;

/** Rows below the rim that the pot and shelf need, rim row included. */
export const SCENERY_DEPTH = SHELF_OFFSET + SHELF_THICKNESS;

/** Half-width of the pot `row` rows below the rim (1 <= row <= POT_HEIGHT). */
function potHalfWidth(row: number): number {
  return row <= 2 ? 7 : 6 - Math.floor((row - 3) / 3);
}

/** True if (x, y) is inside the pot body, where plant strokes are hidden. */
export function isBehindPot(x: number, y: number, anchorX: number, rimY: number): boolean {
  const row = y - rimY;
  return row >= 1 && row <= POT_HEIGHT && Math.abs(x - anchorX) <= potHalfWidth(row);
}

export function paintScenery(
  set: (x: number, y: number, tone: SceneryTone) => void,
  anchorX: number,
  rimY: number,
  width: number,
): void {
  for (let x = anchorX - 6; x <= anchorX + 6; x++) set(x, rimY, 'soil');

  for (let row = 1; row <= POT_HEIGHT; row++) {
    const half = potHalfWidth(row);
    for (let x = anchorX - half; x <= anchorX + half; x++) {
      // The right edge is shaded to give the pot some volume.
      set(x, rimY + row, x > anchorX + half - 3 ? 'potShade' : 'pot');
    }
  }

  for (let x = 0; x < width; x++) {
    set(x, rimY + SHELF_OFFSET, 'shelf');
    set(x, rimY + SHELF_OFFSET + 1, 'shelf');
    set(x, rimY + SHELF_OFFSET + 2, 'shelfShade');
  }
}
