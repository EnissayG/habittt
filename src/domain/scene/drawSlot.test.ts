import { PLANT_GRID } from '../plant/grid';
import { renderPlant, shelfRowsUnderPot } from '../plant/renderPlant';
import { drawSlot } from './drawSlot';

const tonesAt = (image: ReturnType<typeof drawSlot>, row: number) =>
  new Set(image.pixels.slice(row * image.width, (row + 1) * image.width).map((p) => p?.tone));

describe('drawSlot', () => {
  it.each([false, true])(
    'draws a bare shelf where a plant would stand (hanging: %s)',
    (hanging) => {
      const image = drawSlot('empty', hanging);
      expect(image.width).toBe(PLANT_GRID.width);
      expect(image.height).toBe(PLANT_GRID.height);
      const [first, last] = shelfRowsUnderPot(hanging);
      expect(tonesAt(image, first)).toEqual(new Set(['shelf']));
      expect(tonesAt(image, last)).toEqual(new Set(['shelfShade']));
      expect(image.pixels.some((p) => p?.tone === 'outline')).toBe(false);
    },
  );

  it('puts its shelf on the same rows as a plant shelf', () => {
    const plant = renderPlant({ species: 'cactus', seed: 3, elapsedDays: 1, relapseDays: [] });
    const [first] = shelfRowsUnderPot(false);
    expect(plant.pixels[first * plant.width]?.tone).toBe('shelf');
    expect(drawSlot('empty', false).pixels[first * plant.width]?.tone).toBe('shelf');
  });

  it('adds a dotted pot with a plus for a new habit', () => {
    const outline = drawSlot('new', false).pixels.filter((p) => p?.tone === 'outline');
    expect(outline.length).toBeGreaterThan(20);
  });
});
