import { PLANT_GRID } from '../plant/grid';
import { drawHalo, HALO_CENTER, HALO_RADIUS, haloRadius } from './drawHalo';

const count = (radius: number) => drawHalo(radius).pixels.filter((pixel) => pixel !== null).length;

describe('haloRadius', () => {
  it('goes from the smallest light to the largest, in whole cells', () => {
    expect(haloRadius(0)).toBe(HALO_RADIUS.min);
    expect(haloRadius(1)).toBe(HALO_RADIUS.max);
    expect(haloRadius(-2)).toBe(HALO_RADIUS.min);
    expect(haloRadius(7)).toBe(HALO_RADIUS.max);
    for (let f = 0; f <= 1; f += 0.01) {
      expect(Number.isInteger(haloRadius(f))).toBe(true);
      expect(haloRadius(f)).toBeGreaterThanOrEqual(haloRadius(Math.max(0, f - 0.01)));
    }
  });

  it('has a step for every cell of radius: the light never jumps', () => {
    const seen = new Set<number>();
    for (let f = 0; f <= 1.0001; f += 0.005) seen.add(haloRadius(f));
    expect(seen.size).toBe(HALO_RADIUS.max - HALO_RADIUS.min + 1);
  });
});

describe('drawHalo', () => {
  it('is drawn on the grid of a plant, so the plant lies exactly over it', () => {
    const halo = drawHalo(12);
    expect(halo.width).toBe(PLANT_GRID.width);
    expect(halo.height).toBe(PLANT_GRID.height);
  });

  it('grows with its radius, and never leaves the grid', () => {
    for (let r = HALO_RADIUS.min; r < HALO_RADIUS.max; r++) {
      expect(count(r + 1)).toBeGreaterThan(count(r));
    }
    const largest = drawHalo(HALO_RADIUS.max);
    largest.pixels.forEach((pixel, i) => {
      if (!pixel) return;
      const dx = (i % largest.width) + 0.5 - HALO_CENTER.x;
      const dy = Math.floor(i / largest.width) + 0.5 - HALO_CENTER.y;
      expect(dx * dx + dy * dy).toBeLessThanOrEqual(HALO_RADIUS.max * HALO_RADIUS.max);
    });
    expect(HALO_CENTER.x - HALO_RADIUS.max).toBeGreaterThanOrEqual(0);
    expect(HALO_CENTER.x + HALO_RADIUS.max).toBeLessThanOrEqual(PLANT_GRID.width);
    expect(HALO_CENTER.y - HALO_RADIUS.max).toBeGreaterThanOrEqual(0);
  });

  it('is symmetric, left and right', () => {
    const halo = drawHalo(15);
    for (let y = 0; y < halo.height; y++) {
      for (let x = 0; x < halo.width / 2; x++) {
        const left = halo.pixels[y * halo.width + x];
        const right = halo.pixels[y * halo.width + (halo.width - 1 - x)];
        // The rim keeps one cell out of two: mirrored cells may alternate there.
        if (left?.tone === 'haloHeart' || right?.tone === 'haloHeart') {
          expect(right?.tone).toBe(left?.tone);
        }
      }
    }
  });

  it('has a bright heart, a body, and a rim that fades: one cell out of two', () => {
    const halo = drawHalo(18);
    const at = (dx: number, dy: number) =>
      halo.pixels[(HALO_CENTER.y + dy) * halo.width + HALO_CENTER.x + dx]?.tone ?? null;
    expect(at(0, 0)).toBe('haloHeart');
    expect(at(12, 0)).toBe('halo');
    const rim = [at(17, 0), at(17, 1), at(17, 2), at(17, 3)];
    expect(rim.filter((tone) => tone === 'halo').length).toBe(2);
    expect(rim.filter((tone) => tone === null).length).toBe(2);
  });

  it('stays within its smallest and largest sizes, and is opaque', () => {
    expect(drawHalo(0)).toEqual(drawHalo(HALO_RADIUS.min));
    expect(drawHalo(99)).toEqual(drawHalo(HALO_RADIUS.max));
    for (const pixel of drawHalo(14).pixels) expect(pixel?.layers ?? []).toEqual([]);
  });
});
