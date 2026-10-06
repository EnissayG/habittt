import { PLANT_GRID, rimRow, shelfRowsUnderPot } from '../../domain';
import { SCENERY } from '../theme/plantPalette';
import { colors } from '../theme/tokens';
import type { PixelGrid } from './colorRuns';

// Decor for shelf slots without a plant, from the mockup: a bare shelf, the
// dotted pot that creates a habit (with a plus), and the dice of the
// "Surprise" tile. Pixels are final colors.

export type SlotArt = 'empty' | 'new' | 'dice';

export function slotArt(kind: SlotArt, hanging = false): PixelGrid<string> {
  const { width, height } = PLANT_GRID;
  const pixels: (string | null)[] = new Array<string | null>(width * height).fill(null);
  const set = (x: number, y: number, color: string) => {
    if (x >= 0 && y >= 0 && x < width && y < height) pixels[y * width + x] = color;
  };

  if (kind !== 'dice') {
    const [first, last] = shelfRowsUnderPot(hanging);
    for (let x = 0; x < width; x++) {
      for (let y = first; y < last; y++) set(x, y, SCENERY.shelf);
      set(x, last, SCENERY.shelfShade);
    }
  }

  if (kind !== 'empty') {
    // A dotted pot outline, where a pot would stand.
    const left = Math.floor(width / 2) - 7;
    const right = left + 14;
    const top = rimRow(false);
    for (let x = left; x <= right; x += 2) {
      set(x, top, colors.border);
      set(x, top + 10, colors.border);
    }
    for (let y = top; y <= top + 10; y += 2) {
      set(left, y, colors.border);
      set(right, y, colors.border);
    }
    if (kind === 'new') {
      for (let x = left + 5; x <= left + 9; x++) set(x, top + 5, colors.border);
      for (let y = top + 3; y <= top + 7; y++) set(left + 7, y, colors.border);
    } else {
      for (const [dx, dy] of [
        [5, 3],
        [9, 3],
        [7, 5],
        [5, 7],
        [9, 7],
      ] as const) {
        set(left + dx, top + dy, colors.border);
      }
    }
  }

  return { width, height, pixels };
}
