import {
  arrangeShelf,
  composeRoom,
  drawFloor,
  drawFloorBoards,
  drawFloorItems,
  drawWindow,
  gestureParts,
  planRoom,
  renderPlant,
  withGesture,
  type PlacedItem,
  type PlantImage,
  type RoomPlan,
} from '../../domain';
import { roomColor, sceneColor } from '../theme/scenePalette';
import { colors } from '../theme/tokens';
import { floorContext, gesturePatch } from './gesturePatch';

const VIEW = 'evening' as const;
const FLOOR_ROWS = 64;
const SPECIES = ['pothos', 'bonsai', 'monstera', 'cactus', 'fern', 'calathea', 'pearls'];

const habits = SPECIES.map((species, i) => ({
  id: `h${i}`,
  species,
  createdAt: `2026-01-0${i + 1}`,
}));
const plants: Record<string, PlantImage> = Object.fromEntries(
  habits.map((habit, i) => [
    habit.id,
    renderPlant({ species: habit.species, seed: 12 + i * 37, elapsedDays: 110, relapseDays: [] }),
  ]),
);
const planWith = (images: Record<string, PlantImage>): RoomPlan =>
  planRoom({
    layout: arrangeShelf(habits),
    plants: images,
    window: drawWindow(VIEW),
    pageWidth: 150,
    labelRows: 12,
  });

const plan = planWith(plants);
const room = composeRoom(plan);
const boards = drawFloorBoards(plan.width, FLOOR_ROWS);
const items = drawFloorItems(plan.width, FLOOR_ROWS, plan.floorItems);
const context = floorContext(room, FLOOR_ROWS, boards, items);
const placedPlants = plan.walls.flatMap((wall) =>
  wall.items.filter((placed) => placed.content.kind === 'plant'),
);
const imageOf = (placed: PlacedItem) => (placed.content as { image: PlantImage }).image;
const idOf = (placed: PlacedItem) => (placed.content as { id: string }).id;
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Every plant with its first, middle and last part, one gesture at a time. */
const moves = placedPlants.flatMap((placed) => {
  const parts = gestureParts(imageOf(placed));
  return [...new Set([parts[0], parts[parts.length >> 1], parts[parts.length - 1]])]
    .filter((part) => part !== undefined)
    .map((part) => ({ placed, moved: withGesture(imageOf(placed), part) }));
});

describe('gesturePatch', () => {
  it('has something to test: every plant of the room can move', () => {
    expect(placedPlants).toHaveLength(SPECIES.length);
    expect(moves.length).toBeGreaterThanOrEqual(SPECIES.length);
    const visible = moves.filter((move) => gesturePatch([move], context, VIEW).walls.length > 0);
    expect(visible.length).toBeGreaterThanOrEqual(moves.length - 2);
  });

  it('is empty when nothing moves', () => {
    expect(gesturePatch([], context, VIEW)).toEqual({ walls: [], floor: [] });
    const still = placedPlants.map((placed) => ({ placed, moved: imageOf(placed) }));
    expect(gesturePatch(still, context, VIEW)).toEqual({ walls: [], floor: [] });
  });

  it.each(moves.map((move, i) => [idOf(move.placed), i] as const))(
    '%s (%i): turns the recorded wall into the wall with the plant moved',
    (id, i) => {
      const move = moves[i]!;
      const patch = gesturePatch([move], context, VIEW);
      const after = composeRoom(planWith({ ...plants, [id]: move.moved }));
      // The wall as it was recorded, then the patch over it.
      const shown = room.pixels.map((source) => roomColor(source, VIEW));
      // A gesture hidden behind another part changes nothing: no patch at all.
      expect(patch.walls.length).toBeLessThanOrEqual(1);
      for (const { x, y, cells } of patch.walls) {
        expect(cells.length).toBeGreaterThan(0);
        for (const cell of cells) shown[(y + cell.y) * room.width + x + cell.x] = cell.color;
      }
      expect(shown).toEqual(after.pixels.map((source) => roomColor(source, VIEW)));
    },
  );

  it.each(moves.map((move, i) => [idOf(move.placed), i] as const))(
    '%s (%i): turns the recorded floor into the floor that mirrors the plant moved',
    (id, i) => {
      const move = moves[i]!;
      const patch = gesturePatch([move], context, VIEW);
      const color = (image: ReturnType<typeof drawFloor>) =>
        image.pixels.map((pixel) => sceneColor(pixel!, VIEW));
      const before = color(drawFloor({ room, rows: FLOOR_ROWS, items: plan.floorItems }));
      const after = color(
        drawFloor({
          room: composeRoom(planWith({ ...plants, [id]: move.moved })),
          rows: FLOOR_ROWS,
          items: plan.floorItems,
        }),
      );
      const patched = new Set<number>();
      for (const cell of patch.floor) {
        const index = cell.y * room.width + cell.x;
        patched.add(index);
        // Rounding only: a level or two out of 255.
        rgb(cell.color).forEach((c, k) =>
          expect(Math.abs(c - rgb(after[index]!)[k]!)).toBeLessThanOrEqual(2),
        );
      }
      // Everything else is left as recorded, and is right as it is.
      before.forEach((was, index) => {
        if (!patched.has(index)) expect(after[index]).toBe(was);
      });
    },
  );

  it('moves the reflection of the plants of the bottom shelf, which the floor shows', () => {
    const lowest = Math.max(...placedPlants.map((placed) => placed.y));
    const low = moves.filter((move) => move.placed.y === lowest);
    expect(low.length).toBeGreaterThan(0);
    expect(low.some((move) => gesturePatch([move], context, VIEW).floor.length > 0)).toBe(true);
  });

  it('patches several plants at once, each in its own place', () => {
    const [a, b] = [moves[0]!, moves.find((move) => move.placed !== moves[0]!.placed)!];
    const both = gesturePatch([a, b], context, VIEW);
    const one = gesturePatch([a], context, VIEW);
    const other = gesturePatch([b], context, VIEW);
    expect(both.walls).toEqual([...one.walls, ...other.walls]);
    expect(both.floor).toEqual([...one.floor, ...other.floor]);
  });

  it('shows the bare wall where a part has left', () => {
    const wall = colors.background.toUpperCase();
    const cells = moves.flatMap((move) =>
      gesturePatch([move], context, VIEW).walls.flatMap((patch) => patch.cells),
    );
    expect(cells.some((cell) => cell.color === wall)).toBe(true);
    for (const cell of cells) expect(cell.color).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('never draws outside the band of rows the shelf shows', () => {
    for (const move of moves) {
      const { from, to } = move.placed.rows;
      for (const { cells } of gesturePatch([move], context, VIEW).walls) {
        for (const cell of cells) {
          expect(cell.y).toBeGreaterThanOrEqual(0);
          expect(cell.y).toBeLessThan(to - from);
        }
      }
    }
  });
});
