import { drawSparkles, drawSun, SUN } from './drawSun';

const at = (image: ReturnType<typeof drawSun>, x: number, y: number) =>
  image.pixels[y * image.width + x]?.tone ?? null;
const reach = (image: ReturnType<typeof drawSun>) => {
  let far = 0;
  image.pixels.forEach((pixel, i) => {
    if (!pixel) return;
    const dx = (i % image.width) + 0.5 - image.width / 2;
    const dy = Math.floor(i / image.width) + 0.5 - image.height / 2;
    far = Math.max(far, Math.sqrt(dx * dx + dy * dy));
  });
  return far;
};
const heart = (image: ReturnType<typeof drawSun>) =>
  image.pixels.filter((pixel) => pixel?.tone === 'sunHeart').length;

describe('drawSun', () => {
  it('has its own grid, above the plant', () => {
    const sun = drawSun(0.5, 3);
    expect([sun.width, sun.height]).toEqual([SUN.width, SUN.height]);
  });

  it('keeps its heart the same, whatever the breath and the time', () => {
    const size = heart(drawSun(0, 0));
    expect(size).toBeGreaterThan(50);
    for (const f of [0.2, 0.5, 1]) {
      for (const t of [0, 3.3, 17]) expect(heart(drawSun(f, t))).toBe(size);
    }
    expect(at(drawSun(1, 5), SUN.width / 2, SUN.height / 2)).toBe('sunHeart');
  });

  it('spreads its air with the breath in, and gathers it back', () => {
    for (const t of [0, 2, 9]) {
      expect(reach(drawSun(1, t))).toBeGreaterThan(reach(drawSun(0.5, t)) + 3);
      expect(reach(drawSun(0.5, t))).toBeGreaterThan(reach(drawSun(0, t)) + 3);
    }
  });

  it('never leaves its grid, even with the lungs full', () => {
    for (let t = 0; t < 20; t += 0.7) {
      const sun = drawSun(1, t);
      for (let x = 0; x < sun.width; x++) {
        expect(at(sun, x, 0)).toBeNull();
        expect(at(sun, x, sun.height - 1)).toBeNull();
      }
      for (let y = 0; y < sun.height; y++) {
        expect(at(sun, 0, y)).toBeNull();
        expect(at(sun, sun.width - 1, y)).toBeNull();
      }
    }
  });

  it('draws its air in waves: several rings of paler and paler light', () => {
    const sun = drawSun(1, 4);
    const tones = new Set(sun.pixels.map((pixel) => pixel?.tone ?? null));
    for (const tone of ['sunGlow', 'airA', 'airB', 'airC'])
      expect(tones.has(tone as never)).toBe(true);
    // Going out from the heart, the light changes more than once.
    const row = Array.from({ length: SUN.width / 2 }, (_, i) =>
      at(sun, SUN.width / 2 + i, SUN.height / 2),
    );
    const changes = row.filter((tone, i) => i > 0 && tone !== row[i - 1]).length;
    expect(changes).toBeGreaterThanOrEqual(4);
  });

  it('ripples with time: the same breath, a different wave', () => {
    expect(drawSun(0.7, 1)).toEqual(drawSun(0.7, 1));
    expect(drawSun(0.7, 1)).not.toEqual(drawSun(0.7, 2));
  });

  it('is opaque: no layer, the colors come from the theme', () => {
    for (const pixel of drawSun(0.6, 2).pixels) expect(pixel?.layers ?? []).toEqual([]);
  });
});

describe('drawSparkles', () => {
  const lit = (t: number) => drawSparkles(70, 110, t).pixels.filter((pixel) => pixel?.tone).length;

  it('starts dark, then lights a few stars one after the other', () => {
    // At the very end, one star at most (a large cross: 9 cells).
    expect(lit(0)).toBeLessThanOrEqual(9);
    const later = [1, 1.5, 2, 2.5, 3].map(lit);
    expect(Math.max(...later)).toBeGreaterThan(10);
  });

  it('twinkles: what shines changes from one moment to the next', () => {
    const a = drawSparkles(70, 110, 3).pixels.map((pixel) => pixel?.tone ?? null);
    const b = drawSparkles(70, 110, 3.3).pixels.map((pixel) => pixel?.tone ?? null);
    expect(a).not.toEqual(b);
  });

  it('is the same every time', () => {
    expect(drawSparkles(70, 110, 2.4)).toEqual(drawSparkles(70, 110, 2.4));
  });
});
