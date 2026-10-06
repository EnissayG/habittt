import { PLANT_GRID, rimRow } from '../../domain';
import { colors } from '../theme/tokens';
import type { PixelGrid } from './colorRuns';

// The dice of the "Surprise" tile, from the mockup: a dotted pot outline
// with five dots. Pixels are final colors. (The shelf's empty slot and
// dotted pot are part of the room: see drawSlot in the domain.)

export function diceArt(): PixelGrid<string> {
  const { width, height } = PLANT_GRID;
  const pixels: (string | null)[] = new Array<string | null>(width * height).fill(null);
  const set = (x: number, y: number) => {
    pixels[y * width + x] = colors.border;
  };

  const left = Math.floor(width / 2) - 7;
  const right = left + 14;
  const top = rimRow(false);
  for (let x = left; x <= right; x += 2) {
    set(x, top);
    set(x, top + 10);
  }
  for (let y = top; y <= top + 10; y += 2) {
    set(left, y);
    set(right, y);
  }
  for (const [dx, dy] of [
    [5, 3],
    [9, 3],
    [7, 5],
    [5, 7],
    [9, 7],
  ] as const) {
    set(left + dx, top + dy);
  }

  return { width, height, pixels };
}
