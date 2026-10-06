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
