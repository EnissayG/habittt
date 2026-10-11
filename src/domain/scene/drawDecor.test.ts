import { PLANT_GRID } from '../plant/grid';
import {
  ARMCHAIR_SIZE,
  drawArmchair,
  drawFloorLamp,
  drawPainting,
  drawRug,
  FLOOR_LAMP_SIZE,
  PAINTING_SIZE,
  PAINTINGS,
  RUG_SIZE,
} from './drawDecor';
import type { SceneImage } from './sceneImage';

const tones = (image: SceneImage) => new Set(image.pixels.map((pixel) => pixel?.tone ?? null));
const filledRows = (image: SceneImage) =>
  Array.from({ length: image.height }, (_, y) =>
    image.pixels.slice(y * image.width, (y + 1) * image.width).some((pixel) => pixel !== null),
  );

describe('drawDecor', () => {
  const pieces: [string, () => SceneImage, { width: number; height: number }][] = [
    ['armchair', drawArmchair, ARMCHAIR_SIZE],
    ['floor lamp', drawFloorLamp, FLOOR_LAMP_SIZE],
    ['rug', drawRug, RUG_SIZE],
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

  it('keeps the furniture at the scale of the plants', () => {
    // A plant cell is 48 wide and its pot about 15: an armchair is wider than
    // one plant, lower than one plant cell, and the lamp is taller than both.
    expect(ARMCHAIR_SIZE.width).toBeGreaterThan(PLANT_GRID.width);
    expect(ARMCHAIR_SIZE.height).toBeLessThan(PLANT_GRID.height);
    expect(FLOOR_LAMP_SIZE.height).toBeGreaterThan(PLANT_GRID.height);
    expect(RUG_SIZE.width).toBeGreaterThan(ARMCHAIR_SIZE.width);
  });

  it('stands the armchair on two legs and the lamp on a foot', () => {
    const chair = drawArmchair();
    const lastRow = chair.pixels.slice(-chair.width).map((pixel) => pixel?.tone ?? null);
    expect(lastRow.filter((tone) => tone === 'trunk').length).toBe(6);
    expect(lastRow.filter((tone) => tone !== null && tone !== 'trunk')).toEqual([]);
    const lamp = drawFloorLamp();
    expect(lamp.pixels.slice(-lamp.width).filter((pixel) => pixel !== null).length).toBe(9);
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
});
