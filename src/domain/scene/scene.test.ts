import { drawWindow, GLASS, WINDOW_SIZE } from './drawWindow';
import type { SceneImage, SceneTone } from './sceneImage';
import { WINDOW_VIEWS } from './windowView';

const tones = (image: SceneImage) => new Set(image.pixels.map((pixel) => pixel?.tone ?? null));

const layerCount = (image: SceneImage, kind: 'tone' | 'plant', tone?: SceneTone) =>
  image.pixels.reduce(
    (sum, pixel) =>
      sum +
      (pixel?.layers.filter(
        (layer) =>
          layer.source.kind === kind &&
          (tone === undefined || (layer.source.kind === 'tone' && layer.source.tone === tone)),
      ).length ?? 0),
    0,
  );

describe('drawWindow', () => {
  it.each(WINDOW_VIEWS)('%s: is two plants wide and deterministic', (view) => {
    const image = drawWindow(view);
    expect(image.width).toBe(WINDOW_SIZE.width);
    expect(image.pixels).toHaveLength(WINDOW_SIZE.width * WINDOW_SIZE.height);
    expect(drawWindow(view)).toEqual(image);
  });

  it('shows the sun by day, the moon and stars at night', () => {
    expect(tones(drawWindow('day')).has('sun')).toBe(true);
    expect(tones(drawWindow('day')).has('star')).toBe(false);
    expect(tones(drawWindow('night')).has('moon')).toBe(true);
    expect(tones(drawWindow('night')).has('star')).toBe(true);
    expect(tones(drawWindow('evening')).has('eveningSun')).toBe(true);
  });

  it('shows snow and bare trees in winter only', () => {
    expect(tones(drawWindow('winter')).has('snow')).toBe(true);
    expect(tones(drawWindow('winter')).has('treeDark')).toBe(false);
    expect(tones(drawWindow('day')).has('snow')).toBe(false);
  });

  it('has frame, curtains and a reflecting glass in every view', () => {
    for (const view of WINDOW_VIEWS) {
      const image = drawWindow(view);
      expect(tones(image).has('frame')).toBe(true);
      expect(tones(image).has('curtain')).toBe(true);
      expect(layerCount(image, 'tone', 'glare')).toBeGreaterThan(0);
    }
  });

  it('keeps the glass inside the window', () => {
    expect(GLASS.x + GLASS.width).toBeLessThanOrEqual(WINDOW_SIZE.width);
    expect(GLASS.y + GLASS.height).toBeLessThanOrEqual(WINDOW_SIZE.height);
  });
});

describe('drawWindow, animated', () => {
  const insideGlass = (i: number) => {
    const x = i % WINDOW_SIZE.width;
    const y = Math.floor(i / WINDOW_SIZE.width);
    return x >= GLASS.x && x < GLASS.x + GLASS.width && y >= GLASS.y && y < GLASS.y + GLASS.height;
  };
  const changed = (a: SceneImage, b: SceneImage) =>
    a.pixels
      .map((p, i) => (JSON.stringify(p) === JSON.stringify(b.pixels[i]) ? -1 : i))
      .filter((i) => i >= 0);

  it.each(WINDOW_VIEWS)('%s: t = 0 is the still window', (view) => {
    expect(drawWindow(view, 0)).toEqual(drawWindow(view));
  });

  it.each(WINDOW_VIEWS)('%s: only the view through the glass moves', (view) => {
    for (const t of [1, 7.5, 60, 3600]) {
      for (const i of changed(drawWindow(view, 0), drawWindow(view, t)))
        expect(insideGlass(i)).toBe(true);
    }
  });

  it('lets the clouds drift slowly', () => {
    const cloudsAt = (t: number) =>
      drawWindow('day', t).pixels.flatMap((p, i) =>
        p?.tone === 'cloud' ? [i % WINDOW_SIZE.width] : [],
      );
    expect(cloudsAt(0)).toEqual(cloudsAt(0.5));
    expect(cloudsAt(20)).not.toEqual(cloudsAt(0));
    // Slowly: a few pixels in ten seconds, never a jump across the glass.
    const shift = Math.min(...cloudsAt(10)) - Math.min(...cloudsAt(0));
    expect(Math.abs(shift)).toBeLessThanOrEqual(8);
  });

  it('makes the stars twinkle at night', () => {
    const stars = (t: number) =>
      drawWindow('night', t).pixels.filter((p) => p?.tone === 'star').length;
    const counts = new Set([0, 0.5, 1, 1.5, 2, 2.5, 3].map(stars));
    expect(counts.size).toBeGreaterThan(1);
    for (const count of counts) expect(count).toBeGreaterThan(5);
  });

  it('lets the snow fall in winter, and only then', () => {
    const flakes = (view: 'winter' | 'day', t: number) =>
      drawWindow(view, t).pixels.flatMap((p, i) =>
        p?.tone === 'snow' && insideGlass(i) ? [i] : [],
      );
    expect(flakes('winter', 2)).not.toEqual(flakes('winter', 0));
    expect(flakes('day', 2)).toEqual([]);
  });

  it('is deterministic for a given t', () => {
    expect(drawWindow('night', 12.25)).toEqual(drawWindow('night', 12.25));
  });
});
