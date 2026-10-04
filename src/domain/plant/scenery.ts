import type { PotPatternId } from './genome';
import type { SceneryTone } from './grid';

// Pot and shelf, drawn under the plant on day 0. Dimensions are relative to
// the pot's anchor so they follow the grid if it grows.

export const POT_HEIGHT = 10;
/** Rows below the rim holding the shelf (inclusive). */
export const SHELF_ROWS = [POT_HEIGHT + 1, POT_HEIGHT + 3] as const;

/** Rows below the rim that the pot and shelf need, rim row included. */
export const SCENERY_DEPTH = SHELF_ROWS[1] + 1;

/** Columns of the tray's feet, relative to the anchor. */
const TRAY_FEET = [-7, -6, 6, 7];

export interface PotDrawing {
  halfWidths: readonly number[];
  pattern: PotPatternId;
  onTray: boolean;
}

export function paintScenery(
  set: (x: number, y: number, tone: SceneryTone) => void,
  anchorX: number,
  rimY: number,
  width: number,
  pot: PotDrawing,
): void {
  const top = pot.halfWidths[0]!;
  for (let x = anchorX - top + 1; x <= anchorX + top - 1; x++) set(x, rimY, 'soil');

  pot.halfWidths.forEach((half, row) => {
    const y = rimY + 1 + row;
    if (half === 0) {
      for (const dx of TRAY_FEET) set(anchorX + dx, y, dx > 0 ? 'potShade' : 'pot');
      return;
    }
    for (let x = anchorX - half; x <= anchorX + half; x++) {
      // The right edge is shaded to give the pot some volume.
      const shaded = x > anchorX + half - 3;
      let tone: SceneryTone = shaded ? 'potShade' : 'pot';
      if (!pot.onTray && pot.pattern === 'band' && (row === 4 || row === 5)) {
        tone = shaded ? 'potPatternShade' : 'potPattern';
      }
      if (
        !pot.onTray &&
        pot.pattern === 'dots' &&
        row >= 3 &&
        row <= 8 &&
        row % 3 === 1 &&
        (x - anchorX + 12) % 4 === (row % 2 ? 0 : 2)
      ) {
        tone = 'potPattern';
      }
      set(x, y, tone);
    }
  });

  for (let x = 0; x < width; x++) {
    set(x, rimY + SHELF_ROWS[0], 'shelf');
    set(x, rimY + SHELF_ROWS[0] + 1, 'shelf');
    set(x, rimY + SHELF_ROWS[1], 'shelfShade');
  }
}
