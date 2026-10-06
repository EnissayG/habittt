/** Any row-major pixel grid: plants, window, floor, icons. */
export interface PixelGrid<P> {
  readonly width: number;
  readonly height: number;
  readonly pixels: readonly (P | null)[];
}

/** Rows [from, to) to draw; the whole grid when omitted. */
export interface RowWindow {
  from: number;
  to: number;
}

export interface ColorRuns {
  color: string;
  /** SVG path in grid units: one rectangle per horizontal run of this color. */
  path: string;
}

/**
 * Groups a grid's pixels by final color, merging horizontal neighbours of
 * the same color into one rectangle: one Skia draw per color instead of one
 * per pixel. `colorOf` may return null for a pixel that should stay empty.
 * With `rows`, only that band is drawn and moved to the top.
 */
export function buildColorRuns<P>(
  grid: PixelGrid<P>,
  colorOf: (pixel: P) => string | null,
  rows: RowWindow = { from: 0, to: grid.height },
): ColorRuns[] {
  const paths = new Map<string, string[]>();
  const colorAt = (x: number, y: number) => {
    const pixel = grid.pixels[y * grid.width + x] ?? null;
    return pixel === null ? null : colorOf(pixel);
  };

  for (let y = Math.max(0, rows.from); y < Math.min(grid.height, rows.to); y++) {
    let x = 0;
    while (x < grid.width) {
      const color = colorAt(x, y);
      if (color === null) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < grid.width && colorAt(end, y) === color) end++;
      const runs = paths.get(color) ?? [];
      runs.push(`M${x} ${y - rows.from}h${end - x}v1h${x - end}Z`);
      paths.set(color, runs);
      x = end;
    }
  }

  return [...paths].map(([color, runs]) => ({ color, path: runs.join('') }));
}
