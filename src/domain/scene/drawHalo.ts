import { PLANT_GRID } from '../plant/grid';
import { SceneCanvas, type SceneImage } from './sceneImage';

// The light of the meditation corner: a disc behind the plant that grows
// with the breath in and withdraws with the breath out (see
// breathFullness). It is drawn on the plant's own grid, so the plant lies
// exactly over it.

/** Radius of the light, in cells, with the lungs empty and full. */
export const HALO_RADIUS = { min: 6, max: 22 } as const;

/** Center of the light on the plant's grid: the middle, a little above the pot. */
export const HALO_CENTER = { x: PLANT_GRID.width / 2, y: 30 } as const;

/** The radius for a breath this full (0 to 1), in whole cells. */
export function haloRadius(fullness: number): number {
  const clamped = Math.min(1, Math.max(0, fullness));
  return HALO_RADIUS.min + Math.round(clamped * (HALO_RADIUS.max - HALO_RADIUS.min));
}

/**
 * The light at a given radius: a bright heart, a body, and a rim of one
 * cell out of two that fades into the wall.
 */
export function drawHalo(radius: number): SceneImage {
  const { width, height } = PLANT_GRID;
  const c = new SceneCanvas(width, height);
  const r = Math.min(HALO_RADIUS.max, Math.max(HALO_RADIUS.min, Math.round(radius)));
  const rim = 2;
  const heart = Math.max(2, Math.round(r * 0.55));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Cell centers, so the disc is symmetric on an even grid.
      const dx = x + 0.5 - HALO_CENTER.x;
      const dy = y + 0.5 - HALO_CENTER.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r * r) continue;
      if (d2 <= heart * heart) c.fill(x, y, 1, 1, 'haloHeart');
      else if (d2 <= (r - rim) * (r - rim)) c.fill(x, y, 1, 1, 'halo');
      else if ((x + y) % 2 === 0) c.fill(x, y, 1, 1, 'halo');
    }
  }
  return c.toImage();
}
