import { CAT_BEAT, type CatPose } from './cat';

// Touching the cat (ADR 0028): a tap, and it answers in its own way; a
// finger left on it, and it settles down and purrs. Every reaction is made
// of the frames of the drawing (`catSprites.ts`), going in and out of a pose
// the way the drawing does. Little hearts float up from its head.

export type CatTouchKind = 'tap' | 'pet';

export interface CatTouch {
  kind: CatTouchKind;
  /** What the cat was doing when touched. */
  pose: CatPose;
  /** For a pet: seconds the finger stayed on it, or null while it still does. */
  held: number | null;
}

/** A heart over the cat: where (cells of the cat's box, facing right) and how visible. */
export interface CatHeart {
  x: number;
  y: number;
  alpha: number;
}

export interface CatReaction {
  /** The frame to show, or null to leave the cat as it was (a tap while it hops). */
  frame: number | null;
  hearts: CatHeart[];
  /** Over: the cat goes back to its day. */
  done: boolean;
}

/** Seconds a heart floats before it is gone. */
export const HEART_LIFE = 1.2;
/** Seconds between two hearts while petting. */
const HEART_EVERY = 0.8;
/** Cells a heart rises in its life. */
const HEART_RISE = 6;

/**
 * What a tap does, pose by pose (one frame a beat): asleep, it wakes a
 * moment, looks, flicks its tail and goes back to sleep; lying, its tail
 * flicks and curls; sitting, its tail sweeps the floor; standing, it jumps
 * on the spot. Hopping, it keeps going: only a heart.
 */
const TAPS: Record<CatPose, { frames: readonly number[]; heart: number }> = {
  sleep: {
    frames: [16, 16, 16, 12, 12, 12, 12, 12, 12, 13, 12, 14, 12, 12, 12, 16, 16, 16],
    heart: 0.6,
  },
  lie: { frames: [13, 12, 14, 12, 13, 15, 15, 15, 13, 12], heart: 0 },
  sit: { frames: [8, 9, 10, 9, 8, 7, 7], heart: 0 },
  stand: { frames: [2, 3, 4, 5, 0, 0], heart: 0.35 },
  walk: { frames: [], heart: 0 },
};

/**
 * Petting: it settles down (from standing, it sits then lies; from sitting,
 * it lies), closes its eyes and stays there, the tail moving a little; when
 * the finger leaves, it opens its eyes and gets back to how it was.
 */
const PET_IN: Record<CatPose, readonly number[]> = {
  stand: [6, 7, 11, 12],
  sit: [11, 12],
  lie: [12],
  sleep: [],
  walk: [],
};
const PET_LOOP: readonly number[] = [17, 17, 17, 17, 18, 18, 17, 17, 17, 17, 19, 19];
const PET_OUT: Record<CatPose, readonly number[]> = {
  stand: [16, 12, 11, 10, 7, 6, 0],
  sit: [16, 12, 11, 10, 7],
  lie: [16, 12],
  sleep: [17],
  walk: [],
};

/** A heart born `age` seconds ago, alternately a little left and right of the head. */
function heart(age: number, index: number): CatHeart | null {
  if (age < 0 || age >= HEART_LIFE) return null;
  const share = age / HEART_LIFE;
  return {
    x: 13 + (index % 2 === 0 ? 0 : 2),
    // Born just over the ears, then rising.
    y: Math.round(-4 - share * HEART_RISE),
    // Fully there, then fading over the last third.
    alpha: share < 2 / 3 ? 1 : (1 - share) * 3,
  };
}

/** The reaction of the cat, `since` seconds after it was touched. */
export function catReaction(touch: CatTouch, since: number): CatReaction {
  const t = Math.max(0, since);
  if (touch.kind === 'tap') {
    const { frames, heart: at } = TAPS[touch.pose];
    const beat = Math.floor(t / CAT_BEAT);
    const one = heart(t - at, 0);
    const end = Math.max(frames.length * CAT_BEAT, at + HEART_LIFE);
    return {
      frame: frames.length === 0 ? null : (frames[Math.min(beat, frames.length - 1)] ?? null),
      hearts: one ? [one] : [],
      done: t >= end,
    };
  }

  // Petting a hopping cat: it keeps hopping, and a heart says thank you.
  if (touch.pose === 'walk') {
    const one = heart(t, 0);
    return { frame: null, hearts: one ? [one] : [], done: t >= HEART_LIFE };
  }

  const into = PET_IN[touch.pose];
  const out = PET_OUT[touch.pose];
  const held = touch.held ?? Infinity;
  const settled = into.length * CAT_BEAT;
  let frame: number;
  if (t < held) {
    const beat = Math.floor(t / CAT_BEAT);
    frame = beat < into.length ? into[beat]! : PET_LOOP[(beat - into.length) % PET_LOOP.length]!;
  } else {
    const beat = Math.floor((t - held) / CAT_BEAT);
    frame = out[Math.min(beat, out.length - 1)] ?? PET_LOOP[0]!;
  }
  // A heart every little while, from the moment it has settled until the finger leaves.
  const hearts: CatHeart[] = [];
  const last = Math.min(t, held);
  for (let i = 0, born = settled; born <= last; i++, born += HEART_EVERY) {
    const one = heart(t - born, i);
    if (one) hearts.push(one);
  }
  const done = t >= held + Math.max(out.length * CAT_BEAT, HEART_LIFE);
  return { frame, hearts, done };
}

/** The little heart, in letters: o outline, h heart, l its light. */
export const CAT_HEART: readonly string[] = [
  '.oo.oo.',
  'ohlohho',
  'ohhhhho',
  '.ohhho.',
  '..oho..',
  '...o...',
];
