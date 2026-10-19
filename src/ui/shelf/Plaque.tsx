import { Canvas, Picture, Rect } from '@shopify/react-native-skia';
import { useIsFocused } from '@react-navigation/native';
import { memo, useMemo } from 'react';

import { drawPlaque, plaqueShine, type PlaqueTier, type PlaqueTurn } from '../../domain';
import type { LightsOffLook } from '../theme/scenePalette';
import { useReduceMotion } from '../useReduceMotion';
import { useWindowClock } from '../useWindowClock';
import { scenePicture } from './scenePicture';

interface PlaqueProps {
  tier: PlaqueTier;
  /** Size in cells. */
  width: number;
  height: number;
  cell: number;
  /** Its place among the plaques of its wall: they shine in turn. */
  turn: PlaqueTurn;
  /** Only the plaques of the wall in view shine. */
  awake: boolean;
  /** Lights off: the plaque darkens with the room. */
  dark: LightsOffLook | null;
  /** Hangs from two chains (under a shelf); a hanging plant's plaque has none. */
  hooks: boolean;
}

/**
 * The plaque under a plant (ADR 0023): wood framed with metal, recorded
 * once; its glint is drawn over it now and then, only on the wall in view,
 * never with "reduce motion". The plaques keep the day's colors: the metal
 * is the metal, whatever the hour.
 */
export const Plaque = memo(function Plaque({
  tier,
  width,
  height,
  cell,
  turn,
  awake,
  dark,
  hooks,
}: PlaqueProps) {
  const focused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const t = useWindowClock(awake && focused && !reduceMotion);
  const base = useMemo(
    () => scenePicture(drawPlaque(tier, width, height, hooks), 'day', cell),
    [tier, width, height, cell, hooks],
  );
  const shine = reduceMotion ? null : plaqueShine(tier, width, height, t, turn, hooks);
  const shinePicture = useMemo(
    () => (shine ? scenePicture(shine, 'day', cell) : null),
    [shine, cell],
  );
  const size = { width: width * cell, height: height * cell };
  return (
    <Canvas style={size}>
      <Picture picture={base} />
      {shinePicture && <Picture picture={shinePicture} />}
      {dark && <Rect x={0} y={0} {...size} color={dark.veil} blendMode="srcATop" />}
    </Canvas>
  );
});
