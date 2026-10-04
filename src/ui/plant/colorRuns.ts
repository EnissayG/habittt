import type { PlantImage, PlantPixel } from '../../domain';

export interface ColorRuns {
  color: string;
  /** SVG path in grid units: one rectangle per horizontal run of this color. */
  path: string;
}

/**
 * Groups a plant's pixels by final color, merging horizontal neighbours of
 * the same color into one rectangle. One Skia draw per color instead of one
 * per pixel (about a dozen instead of several hundred).
 */
export function buildColorRuns(
  image: PlantImage,
  colorOf: (pixel: PlantPixel) => string,
): ColorRuns[] {
  const paths = new Map<string, string[]>();

  for (let y = 0; y < image.height; y++) {
    let x = 0;
    while (x < image.width) {
      const pixel = image.pixels[y * image.width + x] ?? null;
      if (!pixel) {
        x++;
        continue;
      }
      const color = colorOf(pixel);
      let end = x + 1;
      while (end < image.width) {
        const next = image.pixels[y * image.width + end] ?? null;
        if (!next || colorOf(next) !== color) break;
        end++;
      }
      const runs = paths.get(color) ?? [];
      runs.push(`M${x} ${y}h${end - x}v1h${x - end}Z`);
      paths.set(color, runs);
      x = end;
    }
  }

  return [...paths].map(([color, runs]) => ({ color, path: runs.join('') }));
}
