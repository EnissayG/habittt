import type { PlantImage } from './grid';

export interface RowRange {
  /** First row holding a pixel (plant, pot or shelf). */
  top: number;
  /** Last row holding a pixel. top > bottom when the image is empty. */
  bottom: number;
}

/**
 * Rows actually used by a plant image. The shelf uses it to give each row
 * the height of its tallest plant: young plants keep the shelves low, and a
 * grown plant is never cut.
 */
export function usedRows(image: PlantImage): RowRange {
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
