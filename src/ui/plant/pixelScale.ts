export interface PixelScale {
  /** Device pixels per plant pixel: always a whole number, at least 1. */
  devicePixelsPerCell: number;
  /** Size of one plant pixel in layout points (what React Native uses). */
  cellSize: number;
  width: number;
  height: number;
}

/**
 * Largest WHOLE number of device pixels per plant pixel that fits in the
 * available space. A whole number keeps every plant pixel exactly k×k
 * device pixels: no uneven widths, no seams, nothing to blur. The plant
 * grows in steps rather than filling the space exactly.
 */
export function pixelScale(
  grid: { width: number; height: number },
  available: { width: number; height: number },
  pixelRatio: number,
): PixelScale {
  const fit = Math.min(
    (available.width * pixelRatio) / grid.width,
    (available.height * pixelRatio) / grid.height,
  );
  const devicePixelsPerCell = Math.max(1, Math.floor(fit));
  const cellSize = devicePixelsPerCell / pixelRatio;
  return {
    devicePixelsPerCell,
    cellSize,
    width: grid.width * cellSize,
    height: grid.height * cellSize,
  };
}
