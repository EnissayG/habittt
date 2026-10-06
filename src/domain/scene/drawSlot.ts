import { PLANT_GRID } from '../plant/grid';
import { rimRow, shelfRowsUnderPot } from '../plant/renderPlant';
import { SceneCanvas, type SceneImage } from './sceneImage';

// Shelf slots without a plant, from the mockup: a bare shelf, or the dotted
// pot (with a plus) that creates a habit. Same size and shelf rows as a
// plant image, so they line up with the plants and are reflected like them.

export type SlotKind = 'empty' | 'new';

export function drawSlot(kind: SlotKind, hanging = false): SceneImage {
  const { width, height } = PLANT_GRID;
  const c = new SceneCanvas(width, height);

  const [first, last] = shelfRowsUnderPot(hanging);
  c.fill(0, first, width, last - first, 'shelf');
  c.fill(0, last, width, 1, 'shelfShade');

  if (kind === 'new') {
    const left = Math.floor(width / 2) - 7;
    const right = left + 14;
    const top = rimRow(hanging);
    for (let x = left; x <= right; x += 2) {
      c.fill(x, top, 1, 1, 'outline');
      c.fill(x, top + 10, 1, 1, 'outline');
    }
    for (let y = top; y <= top + 10; y += 2) {
      c.fill(left, y, 1, 1, 'outline');
      c.fill(right, y, 1, 1, 'outline');
    }
    c.fill(left + 5, top + 5, 5, 1, 'outline');
    c.fill(left + 7, top + 3, 1, 5, 'outline');
  }

  return c.toImage();
}
