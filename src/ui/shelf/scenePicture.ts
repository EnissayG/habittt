import {
  AlphaType,
  ColorType,
  createPicture,
  FilterMode,
  MipmapMode,
  Skia,
  type SkCanvas,
  type SkImage,
  type SkPicture,
} from '@shopify/react-native-skia';

import type { PlacedItem, PlantPixel, ScenePixel, SceneImage, WindowView } from '../../domain';
import { buildColorRuns, type ColorRuns } from '../plant/colorRuns';
import { plantColor } from '../theme/plantPalette';
import { sceneColor } from '../theme/scenePalette';
import type { FloorMirror } from './floorMirror';

/** Draws color runs (in grid units) with sharp pixels, antialiasing off. */
function drawRuns(canvas: SkCanvas, runs: readonly ColorRuns[]) {
  const paint = Skia.Paint();
  paint.setAntiAlias(false);
  for (const { color, path } of runs) {
    const shape = Skia.Path.MakeFromSVGString(path);
    if (!shape) continue;
    paint.setColor(Skia.Color(color));
    canvas.drawPath(shape, paint);
  }
}

/**
 * Records a scene image once, as a Skia picture at `cell` points per pixel.
 * Drawing it again (each page of the shelf shows its part of the same
 * floor) costs one draw call, whatever the number of colors.
 */
export function scenePicture(image: SceneImage, view: WindowView, cell: number): SkPicture {
  const runs = buildColorRuns(image, (pixel: ScenePixel) => sceneColor(pixel, view));
  return createPicture(
    (canvas) => {
      canvas.scale(cell, cell);
      drawRuns(canvas, runs);
    },
    { width: image.width * cell, height: image.height * cell },
  );
}

/** Origin of a wall's page and of the room, in points, and the cell size. */
export interface WallFrame {
  /** Left of the page, in room points (wall index × page width). */
  pageLeft: number;
  /** Top of the room on screen, in points. */
  roomTop: number;
  cell: number;
  devicePixelsPerCell: number;
  pixelRatio: number;
}

/**
 * Records every item of a wall but the window, in page coordinates: one
 * picture for the whole wall, so neighbouring places can never leave a seam
 * between them. Positions are computed in device pixels first, then turned
 * into points once.
 */
export function wallPicture(
  items: readonly PlacedItem[],
  view: WindowView,
  frame: WallFrame,
  size: { width: number; height: number },
): SkPicture {
  const { cell, devicePixelsPerCell: k, pixelRatio } = frame;
  return createPicture((canvas) => {
    for (const placed of items) {
      const { content, rows } = placed;
      if (content.kind === 'window') continue;
      const runs =
        content.kind === 'plant'
          ? buildColorRuns(
              content.image,
              (pixel: PlantPixel) => plantColor(pixel, content.image.genome),
              rows,
            )
          : buildColorRuns(content.image, (pixel: ScenePixel) => sceneColor(pixel, view), rows);
      canvas.save();
      canvas.translate(
        (placed.x * k) / pixelRatio - frame.pageLeft,
        frame.roomTop + (placed.y * k) / pixelRatio,
      );
      canvas.scale(cell, cell);
      drawRuns(canvas, runs);
      canvas.restore();
    }
  }, size);
}

/** The reflection's pixels as one Skia image (null if Skia cannot make it). */
export function mirrorImage(mirror: FloorMirror): SkImage | null {
  return Skia.Image.MakeImage(
    {
      width: mirror.width,
      height: mirror.height,
      alphaType: AlphaType.Premul,
      colorType: ColorType.RGBA_8888,
    },
    Skia.Data.fromBytes(mirror.bytes),
    mirror.width * 4,
  );
}

/**
 * Records the whole floor once, at `cell` points per pixel: the boards, the
 * reflection over them (one image, one draw), then what lies on the floor.
 */
export function floorPicture(
  boards: SceneImage,
  mirror: SkImage,
  items: SceneImage,
  view: WindowView,
  cell: number,
): SkPicture {
  const below = buildColorRuns(boards, (pixel: ScenePixel) => sceneColor(pixel, view));
  const above = buildColorRuns(items, (pixel: ScenePixel) => sceneColor(pixel, view));
  const paint = Skia.Paint();
  paint.setAntiAlias(false);
  const whole = Skia.XYWHRect(0, 0, mirror.width(), mirror.height());
  return createPicture(
    (canvas) => {
      canvas.scale(cell, cell);
      drawRuns(canvas, below);
      canvas.drawImageRectOptions(mirror, whole, whole, FilterMode.Nearest, MipmapMode.None, paint);
      drawRuns(canvas, above);
    },
    { width: boards.width * cell, height: boards.height * cell },
  );
}
