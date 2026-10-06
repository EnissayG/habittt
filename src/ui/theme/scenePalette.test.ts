import {
  arrangeShelf,
  composeRoom,
  drawFloor,
  drawWindow,
  planRoom,
  renderPlant,
  WINDOW_VIEWS,
  type ScenePixel,
} from '../../domain';
import { plantColor } from './plantPalette';
import { sceneColor } from './scenePalette';
import { colors } from './tokens';

const HEX = /^#[0-9A-F]{6}$/;

describe('sceneColor', () => {
  it.each(WINDOW_VIEWS)('%s: gives a color to every window and floor pixel', (view) => {
    const plant = renderPlant({ species: 'fern', seed: 3, elapsedDays: 90, relapseDays: [] });
    const plan = planRoom({
      layout: arrangeShelf([{ id: 'f', species: 'fern', createdAt: '' }]),
      plants: { f: plant },
      window: drawWindow(view),
      pageWidth: 160,
      labelRows: 8,
    });
    const floor = drawFloor({ room: composeRoom(plan), rows: 52 });
    for (const image of [drawWindow(view), floor]) {
      for (const pixel of image.pixels) {
        if (pixel) expect(sceneColor(pixel, view)).toMatch(HEX);
      }
    }
  });

  it('shows the wall where nothing opaque was drawn', () => {
    const pixel: ScenePixel = { tone: null, layers: [] };
    expect(sceneColor(pixel, 'day')).toBe(colors.background.toUpperCase());
  });

  it('blends layers like a canvas with globalAlpha (8-bit rounding)', () => {
    // seam #4A2E16 under 50% white: round((255 + 74) / 2) = 165 = A5, etc.
    const pixel: ScenePixel = {
      tone: 'seam',
      layers: [{ alpha: 0.5, source: { kind: 'tone', tone: 'glare' } }],
    };
    expect(sceneColor(pixel, 'day')).toBe('#A5978B');
  });

  it('reflects a plant with its own color', () => {
    const plant = renderPlant({ species: 'cactus', seed: 1, elapsedDays: 60, relapseDays: [] });
    const leaf = plant.pixels.find((p) => p && p.day > 0)!;
    const pixel: ScenePixel = {
      tone: 'plank0',
      layers: [{ alpha: 1, source: { kind: 'plant', pixel: leaf, genome: plant.genome } }],
    };
    expect(sceneColor(pixel, 'night')).toBe(plantColor(leaf, plant.genome).toUpperCase());
  });

  it('changes the sky with the view', () => {
    const sky: ScenePixel = { tone: 'sky0', layers: [] };
    expect(sceneColor(sky, 'day')).not.toBe(sceneColor(sky, 'night'));
  });
});
