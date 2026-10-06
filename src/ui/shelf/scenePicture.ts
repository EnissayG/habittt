import { createPicture, Skia, type SkPicture } from '@shopify/react-native-skia';

import type { ScenePixel, SceneImage, WindowView } from '../../domain';
import { buildColorRuns } from '../plant/colorRuns';
import { sceneColor } from '../theme/scenePalette';

/**
 * Records a scene image once, as a Skia picture at `cell` points per pixel:
 * one rectangle per run of a color, antialiasing off. Drawing it again
 * (each page of the shelf shows its part of the same floor) costs one draw
 * call, whatever the number of colors.
 */
export function scenePicture(image: SceneImage, view: WindowView, cell: number): SkPicture {
  const runs = buildColorRuns(image, (pixel: ScenePixel) => sceneColor(pixel, view));
  return createPicture(
    (canvas) => {
      canvas.scale(cell, cell);
      const paint = Skia.Paint();
      paint.setAntiAlias(false);
      for (const { color, path } of runs) {
        const shape = Skia.Path.MakeFromSVGString(path);
        if (!shape) continue;
        paint.setColor(Skia.Color(color));
        canvas.drawPath(shape, paint);
      }
    },
    { width: image.width * cell, height: image.height * cell },
  );
}
