import { PLANT_GRID, type PlantImage } from '../plant/grid';
import { sin } from '../plant/trig';
import { GLASS } from './drawWindow';
import { SceneCanvas, type SceneImage } from './sceneImage';
import type { WindowView } from './windowView';

// The floor under the shelves, ported from drawRoom() in the mockup: dark
// polished wood that reflects the bottom shelf's plants and the window's
// light. As wide as three plants. The view is accepted (the light's color
// depends on it, in the theme) and t is reserved for animation, like the
// window.

export const ROOM_SIZE = { width: PLANT_GRID.width * 3, height: 52 } as const;

/** Rows above the first plank (wall line and baseboard). */
const FLOOR_TOP = 3;
const PLANK_HEIGHTS = [4, 5, 6, 7, 8, 9, 10];
const PLANK_TONES = ['plank0', 'plank1', 'plank2'] as const;

/** The window sits in the 2nd and 3rd slots of the top row. */
const WINDOW_LEFT = PLANT_GRID.width;

/** Rows of a plant reflected on the floor (from its bottom). */
const REFLECTED_ROWS = 40;
const REFLECTION_SQUASH = 0.8;
const REFLECTION_DEPTH = 34;
const REFLECTION_ALPHA = 0.34;

/** Light columns (from the glass's left edge) and floor rows left dark by the mullions' shadow. */
const SHADOW_COLUMNS: readonly number[] = [16, 34, 35, 53];
const SHADOW_ROWS: readonly number[] = [14, 15];

export interface DrawRoomParams {
  /** The window view (sets the light's color in the theme). */
  view: WindowView;
  /** The bottom shelf's plants, slot by slot (null = empty slot). */
  reflected: readonly (PlantImage | null)[];
  /** Animation time, reserved: always 0 today. */
  t?: number;
}

export function drawRoom({ reflected }: DrawRoomParams): SceneImage {
  const { width, height } = ROOM_SIZE;
  const c = new SceneCanvas(width, height);

  c.fill(0, 0, width, 2, 'wallLine');
  c.fill(0, 2, width, 1, 'baseboard');

  // Planks, wider towards the viewer, with their seams.
  const seams: number[] = [];
  let y = FLOOR_TOP;
  PLANK_HEIGHTS.forEach((h, i) => {
    c.fill(0, y, width, h, PLANK_TONES[i % 3]!);
    c.blend(0, y, width, 1, { kind: 'tone', tone: 'shine' }, 0.05);
    for (let x = (i * 53 + 17) % 61; x < width; x += 61 + i * 7) c.fill(x, y, 1, h, 'seam');
    y += h;
    seams.push(y - 1);
    c.fill(0, y - 1, width, 1, 'seam');
  });

  // The bottom shelf, upside down, squashed and fading.
  reflected.forEach((plant, slot) => {
    if (!plant) return;
    for (let sy = plant.height - 1; sy >= plant.height - REFLECTED_ROWS; sy--) {
      const fy = FLOOR_TOP + Math.floor((plant.height - 1 - sy) * REFLECTION_SQUASH);
      const t = (fy - FLOOR_TOP) / REFLECTION_DEPTH;
      if (t >= 1) break;
      for (let x = 0; x < plant.width; x++) {
        const pixel = plant.pixels[sy * plant.width + x];
        if (!pixel) continue;
        const rx = slot * plant.width + x + (fy % 3 === 1 ? 1 : 0);
        c.blend(
          rx,
          fy,
          1,
          1,
          { kind: 'plant', pixel, genome: plant.genome },
          REFLECTION_ALPHA * (1 - t),
        );
      }
    }
  });

  // The window's light, rippling on the wood, crossed by the mullions' shadow.
  const glassLeft = WINDOW_LEFT + GLASS.x;
  for (let fy = FLOOR_TOP; fy < height - 2; fy++) {
    const t = (fy - FLOOR_TOP) / 48;
    const wobble = Math.round(sin(fy * 1.3) * 1.2);
    const alpha = (seams.includes(fy) ? 0.2 : 0.58) * (1 - t * 0.85);
    for (let x = glassLeft; x < glassLeft + GLASS.width; x++) {
      if (SHADOW_COLUMNS.includes(x - glassLeft) || SHADOW_ROWS.includes(fy - FLOOR_TOP)) continue;
      c.blend(x + wobble, fy, 1, 1, { kind: 'tone', tone: 'floorLight' }, alpha);
    }
  }

  return c.toImage();
}
