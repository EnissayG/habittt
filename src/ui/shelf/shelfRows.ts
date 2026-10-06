import {
  PLANT_GRID,
  resolveSpecies,
  SLOTS_PER_SHELF,
  WINDOW_SIZE,
  type HabitId,
  type PlantImage,
  type Shelf,
} from '../../domain';
import type { PixelGrid, RowWindow } from '../plant/colorRuns';
import { slotArt } from '../plant/slotArt';

// Turns the domain's shelf layout into rows of slots, each with the band of
// image rows to show. A row is as tall as its tallest content, so young
// plants keep shelves low and grown plants are never cut.

export type SlotView =
  | { kind: 'plant'; id: HabitId; image: PlantImage; name: string; streak: number }
  | { kind: 'new'; art: PixelGrid<string> }
  | { kind: 'empty'; art: PixelGrid<string> };

export interface ShelfRowView {
  kind: 'window' | 'hanging' | 'shelf';
  slots: SlotView[];
  /** Image rows shown for every slot of the row. */
  rows: RowWindow;
}

/** First and last rows holding a pixel, for any grid. */
export function filledRows<P>(grid: PixelGrid<P>): { top: number; bottom: number } {
  let top = grid.height;
  let bottom = -1;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.pixels[y * grid.width + x] !== null) {
        top = Math.min(top, y);
        bottom = y;
        break;
      }
    }
  }
  return { top, bottom };
}

const H = PLANT_GRID.height;

function gridOf(slot: SlotView): PixelGrid<unknown> {
  return slot.kind === 'plant' ? slot.image : slot.art;
}

/** Hanging rows show the top of the images, down to the lowest vine. */
function topBand(slots: SlotView[], minimum = 0): RowWindow {
  const bottom = Math.max(...slots.map((slot) => filledRows(gridOf(slot)).bottom));
  return { from: 0, to: Math.min(H, Math.max(minimum, bottom + 1)) };
}

/** Standing rows show the bottom of the images, up to the tallest plant. */
function bottomBand(slots: SlotView[], minimum = 0): RowWindow {
  const top = Math.min(...slots.map((slot) => filledRows(gridOf(slot)).top));
  return { from: Math.max(0, Math.min(H - minimum, top)), to: H };
}

export function buildShelfRows(shelf: Shelf): ShelfRowView[] {
  const plantSlot = (id: HabitId): SlotView => {
    const summary = shelf.habits[id]!;
    return {
      kind: 'plant',
      id,
      image: summary.plant,
      name: summary.habit.name,
      streak: summary.stats.currentStreak,
    };
  };
  const fill = (slots: SlotView[], hanging: boolean) => {
    while (slots.length < SLOTS_PER_SHELF)
      slots.push({ kind: 'empty', art: slotArt('empty', hanging) });
    return slots;
  };

  const rows: ShelfRowView[] = [];

  // Top row: one plant beside the window (as tall as the window at least).
  const top = shelf.layout.windowSlot;
  if (top !== null) {
    const slot = plantSlot(top);
    const hanging = resolveSpecies(shelf.habits[top]!.habit.species).species.hanging;
    rows.push({
      kind: 'window',
      slots: [slot],
      rows: hanging ? topBand([slot], WINDOW_SIZE.height) : bottomBand([slot], WINDOW_SIZE.height),
    });
  } else {
    rows.push({ kind: 'window', slots: [], rows: { from: 0, to: WINDOW_SIZE.height } });
  }

  for (const ids of shelf.layout.hangingRows) {
    const slots = fill(ids.map(plantSlot), true);
    rows.push({ kind: 'hanging', slots, rows: topBand(slots) });
  }

  for (const shelfSlots of shelf.layout.shelves) {
    const slots = fill(
      shelfSlots.map((slot): SlotView =>
        slot.kind === 'plant' ? plantSlot(slot.id) : { kind: 'new', art: slotArt('new') },
      ),
      false,
    );
    rows.push({ kind: 'shelf', slots, rows: bottomBand(slots) });
  }

  return rows;
}
