export interface RowRange {
  /** First row holding a pixel (plant, pot or shelf). */
  top: number;
  /** Last row holding a pixel. top > bottom when the image is empty. */
  bottom: number;
}

/**
 * Rows actually used by an image (a plant, or any row-major grid). The shelf uses it to give each row
 * the height of its tallest plant: young plants keep the shelves low, and a
 * grown plant is never cut.
 */
export function usedRows(image: {
  readonly width: number;
  readonly height: number;
  readonly pixels: readonly unknown[];
}): RowRange {
  let top = image.height;
  let bottom = -1;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (image.pixels[y * image.width + x]) {
        if (y < top) top = y;
        bottom = y;
        break;
      }
    }
  }
  return { top, bottom };
}

/** How far from the finger a grown pixel may be, in cells. */
const TOUCH_RADIUS = 3;

/**
 * The day under a finger at (x, y), in image cells: the day of the nearest
 * grown pixel within a small radius (fingers are bigger than pixels). The
 * pot and the shelf (day 0) answer nothing.
 */
export function dayAt(
  image: {
    readonly width: number;
    readonly height: number;
    readonly pixels: readonly ({ readonly day: number } | null)[];
  },
  x: number,
  y: number,
): number | null {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let best: { distance: number; day: number } | null = null;
  for (let py = cy - TOUCH_RADIUS; py <= cy + TOUCH_RADIUS; py++) {
    for (let px = cx - TOUCH_RADIUS; px <= cx + TOUCH_RADIUS; px++) {
      if (px < 0 || py < 0 || px >= image.width || py >= image.height) continue;
      const pixel = image.pixels[py * image.width + px];
      if (!pixel || pixel.day === 0) continue;
      const distance = (px - cx) ** 2 + (py - cy) ** 2;
      if (distance > TOUCH_RADIUS ** 2) continue;
      if (!best || distance < best.distance) best = { distance, day: pixel.day };
    }
  }
  return best?.day ?? null;
}
