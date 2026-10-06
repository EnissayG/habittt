import { useCallback } from 'react';
import { PixelRatio, View } from 'react-native';

import type { PlantImage, PlantPixel } from '../../domain';
import { NEUTRAL_VITALITY, plantColor, type Vitality } from '../theme/plantPalette';
import type { RowWindow } from './colorRuns';
import { PixelCanvas } from './PixelCanvas';
import { pixelScale } from './pixelScale';

interface PlantCanvasProps {
  image: PlantImage;
  /** Space available, in layout points. The plant fits inside, centered. */
  maxWidth: number;
  maxHeight: number;
  vitality?: Vitality;
}

/** A plant scaled to fit a space, at a whole number of device pixels per cell. */
export function PlantCanvas({
  image,
  maxWidth,
  maxHeight,
  vitality = NEUTRAL_VITALITY,
}: PlantCanvasProps) {
  const scale = pixelScale(image, { width: maxWidth, height: maxHeight }, PixelRatio.get());
  return (
    <View style={{ width: maxWidth, alignItems: 'center' }}>
      <PlantPixels image={image} cellSize={scale.cellSize} vitality={vitality} />
    </View>
  );
}

interface PlantPixelsProps {
  image: PlantImage;
  cellSize: number;
  rows?: RowWindow;
  vitality?: Vitality;
}

/** A plant at a given cell size, optionally cropped to a band of rows (shelf). */
export function PlantPixels({
  image,
  cellSize,
  rows,
  vitality = NEUTRAL_VITALITY,
}: PlantPixelsProps) {
  const colorOf = useCallback(
    (pixel: PlantPixel) => plantColor(pixel, image.genome, vitality),
    [image.genome, vitality],
  );
  return <PixelCanvas grid={image} colorOf={colorOf} cellSize={cellSize} rows={rows} />;
}
