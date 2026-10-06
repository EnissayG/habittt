import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { buildColorRuns, type PixelGrid, type RowWindow } from './colorRuns';

interface PixelCanvasProps<P> {
  grid: PixelGrid<P>;
  /** Final color of a pixel; must be stable (memoized) between renders. */
  colorOf: (pixel: P) => string | null;
  /** Size of one grid pixel in layout points: a whole number of device pixels (see pixelScale). */
  cellSize: number;
  /** Band of rows to draw (cropping); the whole grid when omitted. */
  rows?: RowWindow;
}

/**
 * Draws any pixel grid with sharp pixels: one Skia path per color, made of
 * rectangles, antialiasing off. With an integer number of device pixels per
 * cell, every edge falls on a device pixel: nothing is resampled or blurred.
 */
export function PixelCanvas<P>({ grid, colorOf, cellSize, rows }: PixelCanvasProps<P>) {
  const from = rows?.from ?? 0;
  const to = rows?.to ?? grid.height;
  const runs = useMemo(
    () => buildColorRuns(grid, colorOf, { from, to }),
    [grid, colorOf, from, to],
  );

  return (
    <Canvas style={{ width: grid.width * cellSize, height: (to - from) * cellSize }}>
      <Group transform={[{ scale: cellSize }]}>
        {runs.map(({ color, path }) => (
          <Path key={color} path={path} color={color} antiAlias={false} />
        ))}
      </Group>
    </Canvas>
  );
}
