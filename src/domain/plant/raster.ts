export type Point = readonly [x: number, y: number];

/** Grid cells of the segment between two points (Bresenham), ends included. */
export function line(x0: number, y0: number, x1: number, y1: number): Point[] {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - x);
  const dy = -Math.abs(endY - y);
  const stepX = x < endX ? 1 : -1;
  const stepY = y < endY ? 1 : -1;
  let error = dx + dy;

  const points: Point[] = [];
  for (;;) {
    points.push([x, y]);
    if (x === endX && y === endY) return points;
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x += stepX;
    }
    if (doubled <= dx) {
      error += dx;
      y += stepY;
    }
  }
}

/** Cells of a polyline through `samples`, without repeating shared ends. */
export function path(samples: readonly Point[]): Point[] {
  const points: Point[] = [];
  for (let i = 1; i < samples.length; i++) {
    const [ax, ay] = samples[i - 1]!;
    const [bx, by] = samples[i]!;
    const segment = line(ax, ay, bx, by);
    // Each segment starts where the previous one ended: skip that point.
    points.push(...(points.length > 0 ? segment.slice(1) : segment));
  }
  return points;
}
