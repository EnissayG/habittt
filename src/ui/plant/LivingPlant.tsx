import { useIsFocused } from '@react-navigation/native';
import { memo } from 'react';

import { livingPlant, type PlantImage } from '../../domain';
import { useWindowClock } from '../useWindowClock';
import { PlantPixels } from './PlantCanvas';

/** Drawn again only when the image changes, not at every beat of the clock. */
const Pixels = memo(PlantPixels);

interface LivingPlantProps {
  image: PlantImage;
  cellSize: number;
}

/**
 * A plant that keeps still and, now and then, makes the small gesture of
 * its species (see the domain's gesture.ts). Only this component follows the
 * clock; the plant is drawn again only when a gesture starts or ends. It
 * keeps still when its screen is not shown, when the app is in the
 * background, and with the phone's "reduce motion" setting.
 */
export function LivingPlant({ image, cellSize }: LivingPlantProps) {
  const t = useWindowClock(useIsFocused());
  return <Pixels image={livingPlant(image, t)} cellSize={cellSize} />;
}
