import { useIsFocused } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CAT_FEET,
  CAT_HEART,
  CAT_SIZE,
  catAt,
  catReaction,
  drawCat,
  type CatBreed,
  type CatTone,
  type CatTouch,
} from '../../domain';
import { PixelCanvas } from '../plant/PixelCanvas';
import {
  CAT_COLORS,
  CAT_HEART_COLORS,
  throughVeil,
  type LightsOffLook,
} from '../theme/scenePalette';
import { useReduceMotion } from '../useReduceMotion';
import { useWindowClock } from '../useWindowClock';
import { startPurr, tickCat } from './catHaptics';

/** How much of the cat the polished floor gives back, just under its feet. */
const REFLECTION = 0.3;
/** Frames per second of the cat's clock: enough for its hops to flow. */
const CAT_FPS = 12;
/** Rows of the floor the cat stands on, under the baseboard line. */
const FEET_BELOW = 2;
/** Milliseconds a finger stays on the cat before it counts as petting. */
const PET_DELAY = 350;

type HeartLetter = 'o' | 'h' | 'l';
const HEART = {
  width: CAT_HEART[0]!.length,
  height: CAT_HEART.length,
  pixels: CAT_HEART.flatMap((row) =>
    [...row].map((letter) => (letter === '.' ? null : (letter as HeartLetter))),
  ),
};

interface CatViewProps {
  breed: CatBreed;
  /** The room's width, in cells: the cat walks along all of it. */
  roomWidth: number;
  /** Points per cell, as the room is drawn. */
  cell: number;
  /** Where the floor line is, in points from the top of the screen. */
  floorY: number;
  dark: LightsOffLook | null;
}

/** A touch being answered: when it began (on the cat's clock), and whether the cat's day waits. */
interface Answer {
  touch: CatTouch;
  start: number;
  /** The day of the cat stops while it reacts, and goes on afterwards where it was. */
  pauses: boolean;
}

/**
 * The cat of the room (ADR 0025, 0027, 0028), laid over the whole room (all
 * walls side by side, in the scroll): it lives from wall to wall along the
 * floor, and the polished floor reflects it. A tap and it answers, a finger
 * left on it and it settles down and purrs; hearts float up. Only its own
 * box catches a touch. With "reduce motion" it sleeps where it is, and a
 * touch is only felt.
 */
export const CatView = memo(function CatView({
  breed,
  roomWidth,
  cell,
  floorY,
  dark,
}: CatViewProps) {
  // A new day of the cat each time the room is opened.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const t = useWindowClock(useIsFocused(), CAT_FPS);
  const reduceMotion = useReduceMotion();
  // Seconds of the room spent answering touches: the cat's day did not go on meanwhile.
  const [waited, setWaited] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);

  const answering = answer?.pauses ? t - answer.start : 0;
  const state = catAt(t - waited - answering, seed, { from: 4, to: roomWidth - 4 });
  const reaction = answer ? catReaction(answer.touch, t - answer.start) : null;
  const frame = reaction?.frame ?? state.frame;
  const { facing } = state;

  // The latest clock and cat, for the touch handlers.
  const now = useRef({ t, state, answer });
  useEffect(() => {
    now.current = { t, state, answer };
  });

  // A reaction over: the cat's day goes on where it stopped.
  const done = reaction?.done ?? false;
  useEffect(() => {
    if (!done || !answer) return;
    if (answer.pauses) setWaited((value) => value + (t - answer.start));
    setAnswer(null);
  }, [done, answer, t]);

  const begin = useCallback((touch: CatTouch) => {
    const { t: at, answer: current } = now.current;
    // A new touch ends the last answer; the time it took is time the day waited.
    if (current?.pauses) setWaited((value) => value + (at - current.start));
    setAnswer({ touch, start: at, pauses: touch.pose !== 'walk' });
  }, []);

  const stopPurr = useRef<(() => void) | null>(null);
  useEffect(() => () => stopPurr.current?.(), []);

  const onPress = useCallback(() => {
    tickCat();
    if (!reduceMotion) begin({ kind: 'tap', pose: now.current.state.pose, held: null });
  }, [begin, reduceMotion]);

  const onLongPress = useCallback(() => {
    stopPurr.current?.();
    stopPurr.current = startPurr();
    if (!reduceMotion) begin({ kind: 'pet', pose: now.current.state.pose, held: null });
  }, [begin, reduceMotion]);

  const onPressOut = useCallback(() => {
    stopPurr.current?.();
    stopPurr.current = null;
    const { t: at, answer: current } = now.current;
    if (current?.touch.kind === 'pet' && current.touch.held === null) {
      setAnswer({ ...current, touch: { ...current.touch, held: at - current.start } });
    }
  }, []);

  const image = useMemo(() => drawCat(breed, frame, facing), [breed, frame, facing]);
  // The reflection: what stands above the paws, upside down under them. A
  // cat in the air leaves the rows over its paws empty: its reflection
  // drops away from it. The tail lying on the floor is not mirrored.
  const mirrored = useMemo(() => {
    const pixels: (CatTone | null)[] = [];
    for (let y = CAT_FEET - 1; y >= 0; y--) {
      pixels.push(...image.pixels.slice(y * image.width, (y + 1) * image.width));
    }
    return { width: image.width, height: CAT_FEET, pixels };
  }, [image]);
  const veil = dark?.veil ?? null;
  const colorOf = useCallback(
    (tone: CatTone) => throughVeil(CAT_COLORS[breed][tone], veil),
    [breed, veil],
  );
  const heartColor = useCallback(
    (letter: HeartLetter) => throughVeil(CAT_HEART_COLORS[letter], veil),
    [veil],
  );

  // The outline under the paws lies on the floor line.
  const top = floorY + (FEET_BELOW - CAT_FEET - 1) * cell;
  return (
    <View pointerEvents="box-none" style={[styles.cat, { left: state.x * cell, top }]}>
      <View
        pointerEvents="none"
        style={[styles.layer, styles.reflection, { top: (CAT_FEET + 1) * cell }]}
      >
        <PixelCanvas grid={mirrored} colorOf={colorOf} cellSize={cell} rows={{ from: 0, to: 9 }} />
      </View>
      <View pointerEvents="none">
        <PixelCanvas grid={image} colorOf={colorOf} cellSize={cell} />
      </View>
      {reaction?.hearts.map((heart, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.layer,
            {
              left: (facing === 'right' ? heart.x : CAT_SIZE.width - heart.x - HEART.width) * cell,
              top: heart.y * cell,
              opacity: heart.alpha,
            },
          ]}
        >
          <PixelCanvas grid={HEART} colorOf={heartColor} cellSize={cell} />
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Le chat"
        accessibilityHint="Touche-le pour qu'il réponde, garde le doigt dessus pour le caresser."
        onPress={onPress}
        onLongPress={onLongPress}
        onPressOut={onPressOut}
        delayLongPress={PET_DELAY}
        style={[styles.layer, { width: CAT_SIZE.width * cell, height: (CAT_FEET + 1) * cell }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  cat: { position: 'absolute' },
  layer: { position: 'absolute', left: 0, top: 0 },
  reflection: { opacity: REFLECTION },
});
