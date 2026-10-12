import {
  CUSHION_SIZE,
  drawCushion,
  drawFlame,
  drawIncenseTimer,
  drawLowTable,
  drawMat,
  drawSmoke,
  drawVase,
  drawWallpaper,
  drawWallShelf,
  EMBER,
  FLAME,
  FLAME_SIZE,
  INCENSE_TIMER_SIZE,
  LOW_TABLE_SIZE,
  MAT_SIZE,
  SMOKE_SIZE,
  VASE_SIZE,
  WALL_SHELF_SIZE,
} from './drawCorner';
import type { SceneImage } from './sceneImage';

const tones = (image: SceneImage) => new Set(image.pixels.map((pixel) => pixel?.tone ?? null));
const at = (image: SceneImage, x: number, y: number) =>
  image.pixels[y * image.width + x]?.tone ?? null;
const count = (image: SceneImage) => image.pixels.filter((pixel) => pixel !== null).length;

describe('the furniture of the corner', () => {
  const pieces: [string, () => SceneImage, { width: number; height: number }][] = [
    ['cushion', drawCushion, CUSHION_SIZE],
    ['mat', drawMat, MAT_SIZE],
    ['low table', drawLowTable, LOW_TABLE_SIZE],
    ['wall shelf', drawWallShelf, WALL_SHELF_SIZE],
    ['vase', drawVase, VASE_SIZE],
  ];

  it.each(pieces)('%s: has its announced size, is opaque and deterministic', (_, draw, size) => {
    const image = draw();
    expect([image.width, image.height]).toEqual([size.width, size.height]);
    expect(image.pixels).toHaveLength(size.width * size.height);
    expect(draw()).toEqual(image);
    for (const pixel of image.pixels) expect(pixel?.layers ?? []).toEqual([]);
  });

  it.each(pieces)('%s: fills its box from the first row to the last', (_, draw) => {
    const image = draw();
    const rows = Array.from({ length: image.height }, (_, y) =>
      Array.from({ length: image.width }, (__, x) => at(image, x, y)).some((t) => t !== null),
    );
    expect(rows[0]).toBe(true);
    expect(rows[rows.length - 1]).toBe(true);
  });

  it('draws the cushion round, lit from the top, pleated', () => {
    const cushion = drawCushion();
    expect(tones(cushion)).toEqual(new Set([null, 'cushion', 'cushionLight', 'cushionShade']));
    // Narrower at the top and the bottom than in the middle.
    const width = (y: number) =>
      Array.from({ length: cushion.width }, (_, x) => at(cushion, x, y)).filter(Boolean).length;
    expect(width(0)).toBeLessThan(width(7));
    expect(width(cushion.height - 1)).toBeLessThan(width(7));
  });

  it('stands the low table on two legs, the stone figure on it, no flame of its own', () => {
    const table = drawLowTable();
    const last = Array.from({ length: table.width }, (_, x) => at(table, x, table.height - 1));
    expect(last.filter((tone) => tone !== null).length).toBe(8);
    expect(tones(table).has('stone')).toBe(true);
    expect(tones(table).has('ember')).toBe(true);
    // The flame and the smoke are drawn apart, because they move.
    expect(tones(table).has('sun')).toBe(false);
    expect(tones(table).has('incense')).toBe(false);
    expect(at(table, EMBER.x, EMBER.y)).toBe('ember');
    // The wick, under where the flame goes.
    expect(at(table, FLAME.x + 1, FLAME.y + FLAME_SIZE.height)).toBe('trunk');
  });

  it('puts books and a singing bowl on the wall shelf, held by two brackets', () => {
    const shelf = drawWallShelf();
    for (const tone of ['bookA', 'bookB', 'bookC', 'brass', 'tableTop', 'tableShade']) {
      expect(tones(shelf).has(tone as never)).toBe(true);
    }
  });

  it('fills the vase with grasses, taller than the vase', () => {
    const vase = drawVase();
    const rows = (tone: string) =>
      new Set(
        vase.pixels.flatMap((p, i) => (p?.tone === tone ? [Math.floor(i / vase.width)] : [])),
      );
    expect(Math.min(...rows('grassPlume'))).toBeLessThan(Math.min(...rows('vase')) - 20);
  });
});

describe('what moves in the corner', () => {
  it('lets the smoke rise from the ember, in the middle of its bottom row', () => {
    for (let t = 0; t < 6; t += 0.5) {
      const smoke = drawSmoke(t);
      expect([smoke.width, smoke.height]).toEqual([SMOKE_SIZE.width, SMOKE_SIZE.height]);
      const lowest = Array.from({ length: 4 }, (_, up) =>
        Array.from({ length: smoke.width }, (__, x) =>
          at(smoke, x, smoke.height - 2 - up) ? x : -1,
        ),
      ).flat();
      expect(lowest.filter((x) => x >= 0).every((x) => Math.abs(x - 4) <= 1)).toBe(true);
    }
  });

  it('moves the smoke with time, and is the same at the same time', () => {
    expect(drawSmoke(1)).toEqual(drawSmoke(1));
    expect(drawSmoke(1)).not.toEqual(drawSmoke(1.5));
  });

  it('thins the smoke out as it rises', () => {
    let low = 0;
    let high = 0;
    for (let t = 0; t < 10; t += 0.25) {
      const smoke = drawSmoke(t);
      smoke.pixels.forEach((pixel, i) => {
        if (!pixel) return;
        if (Math.floor(i / smoke.width) > smoke.height / 2) low++;
        else high++;
      });
    }
    expect(high).toBeLessThan(low);
    expect(tones(drawSmoke(3)).has('incenseFaint')).toBe(true);
  });

  it('makes the flame flicker: a few shapes, never out', () => {
    const shapes = new Set<string>();
    for (let t = 0; t < 10; t += 0.25) {
      const flame = drawFlame(t);
      expect([flame.width, flame.height]).toEqual([FLAME_SIZE.width, FLAME_SIZE.height]);
      expect(count(flame)).toBeGreaterThanOrEqual(2);
      expect(at(flame, 1, 3)).toBe('sun');
      shapes.add(JSON.stringify(flame.pixels));
    }
    expect(shapes.size).toBeGreaterThan(1);
  });
});

describe('the incense of a session', () => {
  const stick = (burnt: number) =>
    drawIncenseTimer(burnt, 0).pixels.filter((pixel) => pixel?.tone === 'trunk').length;

  it('is new at the start and burnt down at the end', () => {
    const image = drawIncenseTimer(0, 0);
    expect([image.width, image.height]).toEqual([
      INCENSE_TIMER_SIZE.width,
      INCENSE_TIMER_SIZE.height,
    ]);
    expect(stick(0)).toBe(26);
    expect(stick(1)).toBe(0);
    expect(stick(-1)).toBe(26);
    expect(stick(2)).toBe(0);
  });

  it('gets shorter as the session passes, never longer', () => {
    for (let b = 0.01; b <= 1; b += 0.01) expect(stick(b)).toBeLessThanOrEqual(stick(b - 0.01));
  });

  it('keeps its ember and its smoke above what is left of the stick', () => {
    for (const burnt of [0, 0.3, 0.7, 1]) {
      const image = drawIncenseTimer(burnt, 2);
      const ember = image.pixels.findIndex((pixel) => pixel?.tone === 'ember');
      expect(ember).toBeGreaterThanOrEqual(0);
      const emberRow = Math.floor(ember / image.width);
      image.pixels.forEach((pixel, i) => {
        if (pixel?.tone === 'incense' && Math.floor(i / image.width) < image.height - 3) {
          expect(Math.floor(i / image.width)).toBeLessThan(emberRow);
        }
      });
    }
  });
});

describe('the wallpaper', () => {
  it('covers any room with sprigs, a moulding and a string of lights', () => {
    const paper = drawWallpaper(300, 120);
    expect([paper.width, paper.height]).toEqual([300, 120]);
    for (const tone of ['wallpaper', 'moulding', 'mouldingShade', 'garland', 'bulb']) {
      expect(tones(paper).has(tone as never)).toBe(true);
    }
    // The moulding runs along the whole ceiling.
    for (let x = 0; x < 300; x++) expect(at(paper, x, 0)).toBe('moulding');
  });

  it('stays light: most of the wall is bare', () => {
    const paper = drawWallpaper(300, 200);
    expect(count(paper)).toBeLessThan(paper.pixels.length / 6);
  });

  it('is the same pattern however wide the room is', () => {
    const narrow = drawWallpaper(100, 80);
    const wide = drawWallpaper(300, 80);
    for (let y = 0; y < 80; y++) {
      for (let x = 0; x < 100; x++) expect(at(wide, x, y)).toBe(at(narrow, x, y));
    }
  });
});
