import {
  mirrorRows,
  REFLECTION,
  type MirrorRow,
  type PlacedItem,
  type PlantImage,
  type RoomImage,
  type SceneImage,
  type WindowView,
} from '../../domain';
import { plantColor } from '../theme/plantPalette';
import { sceneColor } from '../theme/scenePalette';
import { colors } from '../theme/tokens';

// A plant on the shelf makes its gesture without the wall being drawn again:
// the wall and the floor stay the pictures recorded once, and for the second
// the gesture lasts, a patch is laid over them. The patch holds only the
// cells that change: on the wall, where the plant's part was and where it
// is now; on the floor, the same cells mirrored, so the reflection moves at
// the same instant.

export interface PatchCell {
  x: number;
  y: number;
  /** Final, opaque color of the cell. */
  color: string;
}

/** The cells of one plant that change, in the cells of its own image as it is shown. */
export interface WallPatch {
  /** Where the plant is placed, in room cells (see PlacedItem). */
  x: number;
  y: number;
  cells: PatchCell[];
}

export interface GesturePatch {
  walls: WallPatch[];
  /** In the cells of the floor image. */
  floor: PatchCell[];
}

/** What the patch needs to know about the floor: computed once per room. */
export interface FloorContext {
  width: number;
  /** The floor row that mirrors each row of the room. */
  mirror: ReadonlyMap<number, MirrorRow>;
  boards: SceneImage;
  /** What lies on the floor: opaque, the reflection never shows through. */
  items: SceneImage;
  /** The wallpaper of the room (see drawWallpaper): what shows where a part has left. */
  wallpaper: SceneImage | null;
}

export function floorContext(
  room: RoomImage,
  rows: number,
  boards: SceneImage,
  items: SceneImage,
  wallpaper: SceneImage | null = null,
): FloorContext {
  return {
    width: room.width,
    mirror: new Map(mirrorRows(room, rows).map((row) => [row.source, row])),
    boards,
    items,
    wallpaper,
  };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (channels: number[]) =>
  `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** A reflection over a board, blended as the floor's image is (premultiplied, 8 bits). */
function reflected(board: string, source: string, alpha: number): string {
  const below = rgb(board);
  const opacity = Math.round(255 * alpha) / 255;
  return hex(
    rgb(source).map((c, i) =>
      Math.min(255, Math.round(Math.round(c * alpha) + below[i]! * (1 - opacity))),
    ),
  );
}

/**
 * The patch that turns the recorded wall and floor into what they are while
 * these plants make their gesture. `moved` is the plant of `placed` with one
 * part moved (see withGesture).
 */
export function gesturePatch(
  moves: readonly { placed: PlacedItem; moved: PlantImage }[],
  floor: FloorContext,
  view: WindowView,
): GesturePatch {
  const patch: GesturePatch = { walls: [], floor: [] };
  const bare = colors.background.toUpperCase();
  // The wall as it is drawn behind the plants: the wallpaper, or the bare wall.
  const wallAt = (x: number, y: number) => {
    const paper = floor.wallpaper;
    const pixel = paper && x >= 0 && x < paper.width ? paper.pixels[y * paper.width + x] : null;
    return pixel ? sceneColor(pixel, view) : bare;
  };

  for (const { placed, moved } of moves) {
    if (placed.content.kind !== 'plant') continue;
    const rest = placed.content.image;
    const { from, to } = placed.rows;
    const cells: PatchCell[] = [];

    for (let cy = Math.max(0, from); cy < Math.min(rest.height, to); cy++) {
      for (let cx = 0; cx < rest.width; cx++) {
        const before = rest.pixels[cy * rest.width + cx] ?? null;
        const after = moved.pixels[cy * rest.width + cx] ?? null;
        const behind = wallAt(placed.x + cx, placed.y + cy - from);
        const now = after ? plantColor(after, moved.genome).toUpperCase() : behind;
        const was = before ? plantColor(before, rest.genome).toUpperCase() : behind;
        if (now === was) continue;
        cells.push({ x: cx, y: cy - from, color: now });

        // The same cell in the floor, if the floor is deep enough to show it.
        const rx = placed.x + cx;
        const row = floor.mirror.get(placed.y + cy - from);
        if (!row || rx < 0 || rx >= floor.width) continue;
        const index = row.y * floor.width + rx;
        if (floor.items.pixels[index]) continue;
        const board = sceneColor(floor.boards.pixels[index]!, view);
        const alpha = (after ? REFLECTION.object : REFLECTION.wall) * row.fade;
        // The wallpaper is not mirrored: an empty cell reflects the bare wall.
        const source = after ? now : bare;
        patch.floor.push({ x: rx, y: row.y, color: reflected(board, source, alpha) });
      }
    }
    if (cells.length > 0) patch.walls.push({ x: placed.x, y: placed.y, cells });
  }
  return patch;
}
