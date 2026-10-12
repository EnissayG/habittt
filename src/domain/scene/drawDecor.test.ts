import {
  drawLantern,
  drawPainting,
  drawScroll,
  LANTERN_SIZE,
  PAINTING_SIZE,
  PAINTINGS,
  SCROLL_SIZE,
} from './drawDecor';
import type { SceneImage } from './sceneImage';

const tones = (image: SceneImage) => new Set(image.pixels.map((pixel) => pixel?.tone ?? null));
const filledRows = (image: SceneImage) =>
  Array.from({ length: image.height }, (_, y) =>
    image.pixels.slice(y * image.width, (y + 1) * image.width).some((pixel) => pixel !== null),
  );

describe('drawDecor', () => {
  const pieces: [string, () => SceneImage, { width: number; height: number }][] = [
    ['scroll', drawScroll, SCROLL_SIZE],
    ['lantern', () => drawLantern(0), LANTERN_SIZE],
    [
      'lantern on a cord',
      () => drawLantern(40),
      { width: LANTERN_SIZE.width, height: LANTERN_SIZE.height + 40 },
    ],
    ...PAINTINGS.map(
      (painting) =>
        [`painting ${painting}`, () => drawPainting(painting), PAINTING_SIZE] as [
          string,
          () => SceneImage,
          { width: number; height: number },
        ],
    ),
  ];

  it.each(pieces)('%s: has its announced size and is deterministic', (_, draw, size) => {
    const image = draw();
    expect(image.width).toBe(size.width);
    expect(image.height).toBe(size.height);
    expect(image.pixels).toHaveLength(size.width * size.height);
    expect(draw()).toEqual(image);
  });

  it.each(pieces)('%s: fills its box from the first row to the last', (_, draw) => {
    const rows = filledRows(draw());
    expect(rows[0]).toBe(true);
    expect(rows[rows.length - 1]).toBe(true);
  });

  it('draws three different pictures in the same frame', () => {
    const images = PAINTINGS.map(drawPainting);
    expect(new Set(images.map((image) => JSON.stringify(image.pixels))).size).toBe(3);
    for (const image of images) expect(tones(image).has('frame')).toBe(true);
    expect(tones(drawPainting('peaks')).has('paintRidge0')).toBe(true);
    expect(tones(drawPainting('sea')).has('paintSea0')).toBe(true);
    expect(tones(drawPainting('bonsai')).has('paintPaper')).toBe(true);
  });

  it('fills every picture up to its frame, which is the same all around', () => {
    for (const image of PAINTINGS.map(drawPainting)) {
      expect(image.pixels.every((pixel) => pixel !== null)).toBe(true);
      const at = (x: number, y: number) => image.pixels[y * image.width + x]!.tone;
      const frame = new Set(['frameDark', 'frame', 'frameLight', 'frameShade']);
      for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
          const inFrame = x < 3 || y < 3 || x >= image.width - 3 || y >= image.height - 3;
          expect(frame.has(at(x, y)!)).toBe(inFrame);
        }
      }
    }
  });

  it('never uses translucent layers: decor is opaque', () => {
    for (const [, draw] of pieces)
      for (const pixel of draw().pixels) expect(pixel?.layers ?? []).toEqual([]);
  });

  it('draws the circle of the scroll open: a stroke, not a ring', () => {
    const scroll = drawScroll();
    const ink = scroll.pixels.filter((p) => p?.tone === 'ink' || p?.tone === 'inkDeep').length;
    expect(ink).toBeGreaterThan(60);
    expect(tones(scroll).has('ink')).toBe(true);
    expect(tones(scroll).has('inkDeep')).toBe(true);
    // Paper shows in the middle of the circle and through its gap.
    const at = (x: number, y: number) => scroll.pixels[y * scroll.width + x]?.tone;
    expect(at(15, 24)).toBe('paintPaper');
    const ring = (dx: number, dy: number) => at(15 + dx, 24 + dy);
    expect(ring(-10, 0)).toMatch(/^ink/);
    expect(ring(7, -7)).toBe('paintPaper');
  });
});
