import { BEATS_PER_SECOND, drawWindow, GLASS, STARS, WINDOW_SIZE } from './drawWindow';
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

  describe('stars', () => {
    const STAR_TONES = ['star', 'starBright', 'starDim', 'starFaint'];
    // A passing cloud may hide a star for a while; nothing else may.
    const VISIBLE_OR_CLOUDED = [...STAR_TONES, 'cloud', 'cloudShade'];
    const frames = Array.from({ length: 250 }, (_, beat) =>
      drawWindow('night', beat / BEATS_PER_SECOND),
    );
    const toneOf = (image: SceneImage, [x, y]: readonly [number, number, number, number]) =>
      image.pixels[(GLASS.y + y) * WINDOW_SIZE.width + GLASS.x + x]?.tone ?? null;

    it('never lets a star appear or disappear: it only changes brightness', () => {
      for (const image of frames)
        for (const star of STARS) expect(VISIBLE_OR_CLOUDED).toContain(toneOf(image, star));
    });

    it('gives every star all its levels of brightness, each at its own rhythm', () => {
      const histories = STARS.map((star) => frames.map((image) => toneOf(image, star)));
      for (const history of histories)
        for (const tone of STAR_TONES) expect(history).toContain(tone);
      expect(new Set(histories.map((history) => history.join())).size).toBe(STARS.length);
    });

    it('never changes all the stars at once', () => {
      for (let i = 1; i < frames.length; i++) {
        const changed = STARS.filter(
          (star) => toneOf(frames[i]!, star) !== toneOf(frames[i - 1]!, star),
        );
        expect(changed.length).toBeLessThanOrEqual(STARS.length * 0.75);
      }
    });
  });

  it('lets a shooting star pass now and then', () => {
    // Outside the stars' own places, a bright pixel can only be the meteor.
    const starPlaces = new Set(
      STARS.map(([x, y]) => (GLASS.y + y) * WINDOW_SIZE.width + GLASS.x + x),
    );
    const meteorAt = (t: number) =>
      drawWindow('night', t).pixels.some((p, i) => p?.tone === 'starBright' && !starPlaces.has(i));
    const moments = Array.from({ length: 240 }, (_, i) => i / 4);
    const passing = moments.filter(meteorAt);
    expect(passing.length).toBeGreaterThan(0);
    expect(passing.length).toBeLessThan(moments.length / 5);
  });

  it('lets smoke rise from the chimney, in every view', () => {
    const smoke = (view: (typeof WINDOW_VIEWS)[number], t: number) =>
      drawWindow(view, t).pixels.flatMap((p, i) => (p?.tone === 'smoke' ? [i] : []));
    for (const view of WINDOW_VIEWS) {
      expect(smoke(view, 0).length).toBeGreaterThan(0);
      expect(smoke(view, 1)).not.toEqual(smoke(view, 0));
    }
  });

  it('makes the lamp of the house flicker after dark only', () => {
    const glows = (view: (typeof WINDOW_VIEWS)[number]) =>
      Array.from({ length: 120 }, (_, beat) => beat / BEATS_PER_SECOND).some((t) =>
        drawWindow(view, t).pixels.some((p) => p?.tone === 'windowGlow'),
      );
    expect(glows('night')).toBe(true);
    expect(glows('evening')).toBe(true);
    expect(glows('day')).toBe(false);
    expect(glows('winter')).toBe(false);
  });

  it('lets the snow fall in winter, and only then', () => {
    const flakes = (view: 'winter' | 'day', t: number) =>
      drawWindow(view, t).pixels.flatMap((p, i) =>
        p?.tone === 'snow' && insideGlass(i) ? [i] : [],
      );
    expect(flakes('winter', 2)).not.toEqual(flakes('winter', 0));
    expect(flakes('day', 2)).toEqual([]);
  });

  it('lets each snowflake fall at its own speed', () => {
    // Flakes do not move as one block: the set of rows they occupy changes shape.
    const rows = (t: number) =>
      drawWindow('winter', t)
        .pixels.flatMap((p, i) => (p?.tone === 'snow' && insideGlass(i) ? [i] : []))
        .map((i) => Math.floor(i / WINDOW_SIZE.width));
    const shape = (t: number) =>
      rows(t)
        .map((row) => row - Math.min(...rows(t)))
        .join();
    expect(shape(3)).not.toEqual(shape(0));
  });

  it('is deterministic for a given t', () => {
    expect(drawWindow('night', 12.25)).toEqual(drawWindow('night', 12.25));
  });
});
