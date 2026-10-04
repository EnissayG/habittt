import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { PixelRatio, View } from 'react-native';

import type { PlantImage } from '../../domain';
import { NEUTRAL_VITALITY, plantColor, type Vitality } from '../theme/plantPalette';
import { buildColorRuns } from './colorRuns';
import { pixelScale } from './pixelScale';

interface PlantCanvasProps {
  image: PlantImage;
  /** Space available, in layout points. The plant fits inside, centered. */
  maxWidth: number;
  maxHeight: number;
  vitality?: Vitality;
}

/**
 * Draws a PlantImage with sharp pixels at any screen size:
 * - a whole number of device pixels per plant pixel (see pixelScale);
 * - rectangles, never a scaled bitmap, so nothing is resampled;
 * - antialiasing off: every edge falls on a device pixel anyway.
 * It computes nothing about the plant itself: the domain did.
 */
export function PlantCanvas({
  image,
  maxWidth,
  maxHeight,
  vitality = NEUTRAL_VITALITY,
}: PlantCanvasProps) {
  const scale = pixelScale(image, { width: maxWidth, height: maxHeight }, PixelRatio.get());
  const runs = useMemo(
    () => buildColorRuns(image, (pixel) => plantColor(pixel, image.genome, vitality)),
    [image, vitality],
  );

  return (
    <View style={{ width: maxWidth, alignItems: 'center' }}>
      <Canvas style={{ width: scale.width, height: scale.height }}>
        <Group transform={[{ scale: scale.cellSize }]}>
          {runs.map(({ color, path }) => (
            <Path key={color} path={path} color={color} antiAlias={false} />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}
