import { CAT_SPRITES } from './catSprites';

// The cat of the room (ADR 0025, 0027): a small pixel cat that lives along
// the floor, from one wall to the next. It sleeps, lies down, sits, gets up
// and hops somewhere else, then settles again. Its frames are a free
// pixel-art cat, kept cell for cell (`catSprites.ts`); the five coats are
// that drawing recolored. Everything is a pure function of time and of a seed.

export const CAT_BREEDS = ['tabby', 'black', 'grey', 'calico', 'siamese'] as const;
export type CatBreed = (typeof CAT_BREEDS)[number];

/** What the cat is doing. */
export type CatPose = 'stand' | 'walk' | 'sit' | 'lie' | 'sleep';

/** What a pixel of the cat is; the UI gives each coat its colors. */
export type CatTone =
  | 'outline'
  | 'fur'
  | 'furLight'
  | 'furShade'
  | 'stripe'
  | 'patchA'
  | 'patchB'
  | 'point'
  | 'eye'
  | 'nose';

export interface CatImage {
  width: number;
  height: number;
  pixels: (CatTone | null)[];
}

/** The cat's box, in cells. */
export const CAT_SIZE = { width: 20, height: 22 } as const;
/**
 * The row of the outline under the paws: it lies on the floor line. The
 * rows below are for the tail, lying on the floor towards the viewer.
 */
export const CAT_FEET = 17;
/** How many frames the drawing has. */
export const CAT_FRAME_COUNT = CAT_SPRITES.length;

/**
 * The frames, by what they show (numbers of `CAT_SPRITES`): standing and
 * breathing; a hop (crouched, going up, in the air with the legs tucked,
 * coming down); sitting down, sitting with the tail sweeping; lying down,
 * lying with the tail flicking; dozing, asleep.
 */
export const CAT_FRAMES = {
  stand: [0, 1],
  hop: [2, 3, 4, 5],
  sitDown: 6,
  sit: [7, 8, 9, 10],
  lieDown: 11,
  lie: [12, 13, 14, 15],
  doze: 16,
  sleep: [17, 18, 19],
} as const;

const TONE_OF: Record<string, CatTone> = {
  a: 'outline',
  b: 'fur',
  c: 'furLight',
  d: 'stripe',
  e: 'furShade',
  f: 'nose',
  E: 'eye',
};

type Region = 'head' | 'ears' | 'mask' | 'tail' | 'legs' | 'body';

/** Which part of the cat a cell belongs to, roughly: enough to paint a coat. */
function region(x: number, y: number, headTop: number): Region {
  if (y > CAT_FEET) return 'tail';
  if (x >= 9 && y <= headTop + 9) {
    if (y <= headTop + 2) return 'ears';
    if (y >= headTop + 7 && x >= 12 && x <= 18) return 'mask';
    return 'head';
  }
  if (x <= 5) return 'tail';
  if (y >= CAT_FEET - 1) return 'legs';
  return 'body';
}

/** The coat of each breed: the drawing's own tones, recolored, with patches or points. */
function coat(breed: CatBreed, tone: CatTone, x: number, y: number, headTop: number): CatTone {
  if (tone === 'outline' || tone === 'eye' || tone === 'nose') return tone;
  const where = region(x, y, headTop);
  switch (breed) {
    case 'tabby':
    case 'black':
    case 'grey':
      return tone;
    case 'calico':
      // White, an orange and a black patch on the head, a black patch on
      // the back, an orange tail.
      if (where === 'tail') return 'patchA';
      if (where === 'ears' || (where === 'head' && y <= headTop + 4)) {
        if (x <= 12) return 'patchA';
        if (x >= 16) return 'patchB';
      }
      if (where === 'body' && x <= 9 && y <= CAT_FEET - 4) return 'patchB';
      return tone === 'stripe' ? 'fur' : tone;
    case 'siamese':
      // Cream; the ears, the mask, the legs and the tail dark.
      if (where === 'ears' || where === 'mask' || where === 'tail' || where === 'legs') {
        return 'point';
      }
      return tone === 'stripe' ? 'fur' : tone;
  }
}

/** One frame of the cat (a number of `CAT_SPRITES`), of a coat, facing right or left. */
export function drawCat(
  breed: CatBreed,
  frame: number,
  facing: 'left' | 'right' = 'right',
): CatImage {
  const n = ((frame % CAT_FRAME_COUNT) + CAT_FRAME_COUNT) % CAT_FRAME_COUNT;
  const rows = CAT_SPRITES[n]!;
  const { width, height } = CAT_SIZE;
  const headTop = rows.findIndex((row) => /[^.]/.test(row.slice(9)));
  const pixels = new Array<CatTone | null>(width * height).fill(null);
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const tone = TONE_OF[letter];
      if (!tone) return;
      const column = facing === 'right' ? x : width - 1 - x;
      pixels[y * width + column] = coat(breed, tone, x, y, headTop);
    });
  });
  return { width, height, pixels };
}

/** What the cat is doing at a moment, and where (left edge, in cells of the room). */
export interface CatState {
  x: number;
  pose: CatPose;
  /** The frame to draw (a number of `CAT_SPRITES`). */
  frame: number;
  facing: 'left' | 'right';
}

/** Seconds a frame of the drawing lasts, as in the original. */
export const CAT_BEAT = 0.17;
const BEAT = CAT_BEAT;

/**
 * A hop: standing, crouched, pushing off (the back paws still down), in the
 * air, coming down, landed. It moves forward only off the floor: on it, its
 * paws stay put.
 */
const HOP = [
  { frame: 0, x: 0 },
  { frame: 2, x: 0 },
  { frame: 3, x: 0 },
  { frame: 4, x: 3 },
  { frame: 5, x: 5 },
  { frame: 0, x: 6 },
] as const;
/** Cells covered by one hop. */
export const CAT_HOP = HOP[HOP.length - 1]!.x;
/** Seconds of one step of a hop. */
const HOP_STEP = 0.14;
/** Cells a hopping cat covers in a second, on average. */
export const CAT_SPEED = CAT_HOP / (HOP.length * HOP_STEP);

interface Segment {
  start: number;
  end: number;
  pose: CatPose;
  /** What it was doing just before: the way it gets into this pose. */
  after: CatPose;
  from: number;
  to: number;
  facing: 'left' | 'right';
}

/** A small linear congruential sequence: integers only, the same on every phone. */
function sequence(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** A few frames played once, `BEAT` each, starting `into` seconds ago; `rest` before and after. */
function played(into: number, frames: readonly number[], rest: number): number {
  if (into < 0) return rest;
  return frames[Math.floor(into / BEAT)] ?? rest;
}

/** The frame of a pose, `into` seconds after it began, coming from `after`. */
function frameOf(pose: CatPose, after: CatPose, into: number): number {
  switch (pose) {
    case 'stand': {
      // Getting up first, if it was sitting; then breathing, the tail moving now and then.
      const up: number[] = after === 'sit' ? [7, CAT_FRAMES.sitDown] : [];
      if (into < up.length * BEAT) return played(into, up, 0);
      return Math.floor(into / (2 * BEAT)) % 4 === 3 ? 1 : 0;
    }
    case 'sit': {
      // Sitting down (from standing) or rising a little (from lying); then
      // still, and now and then the tail sweeps the floor.
      const down: number[] = after === 'lie' ? [CAT_FRAMES.lieDown, 10] : [CAT_FRAMES.sitDown];
      if (into < down.length * BEAT) return played(into, down, 7);
      const t = (into - down.length * BEAT) % 5;
      return played(t - 3.8, [8, 9, 10, 9, 8], 7);
    }
    case 'lie': {
      // Lying down (from sitting) or waking up (from sleep); then the tail flicks now and then.
      const down: number[] = after === 'sleep' ? [CAT_FRAMES.doze] : [CAT_FRAMES.lieDown];
      if (into < down.length * BEAT) return played(into, down, 12);
      const t = (into - down.length * BEAT) % 6;
      return played(t - 4, [13, 12, 14, 12, 13, 15, 15, 15, 13], 12);
    }
    case 'sleep': {
      // Dozing off, then asleep; the tail twitches in its sleep.
      if (into < 3 * BEAT) return CAT_FRAMES.doze;
      const t = (into - 3 * BEAT) % 4.5;
      return played(t - 3.6, [18, 19, 18], 17);
    }
    case 'walk':
      return 0;
  }
}

/**
 * Where the cat is at time t (seconds since the room was shown), along
 * [from, to) (cells of the floor line). It starts asleep; it wakes, lies a
 * moment, sits, gets up and hops somewhere else, often to another wall;
 * there it stands, sits, maybe lies down and sleeps again, or hops on.
 */
export function catAt(t: number, seed: number, span: { from: number; to: number }): CatState {
  const random = sequence(seed);
  const lo = span.from;
  const hi = Math.max(lo, span.to - CAT_SIZE.width);
  const pick = (a: number, b: number) => a + random() * (b - a);
  let x = Math.round(pick(lo, hi));
  let facing: 'left' | 'right' = random() < 0.5 ? 'left' : 'right';
  let time = 0;
  let next: CatPose = 'sleep';
  let after: CatPose = 'sleep';
  const now = Math.max(0, t);

  for (let guard = 0; guard < 100000; guard++) {
    let segment: Segment;
    if (next === 'walk') {
      // Often far away, to another wall; sometimes just a few hops.
      const far = random() < 0.7;
      let target = Math.round(pick(lo, hi));
      if (far && Math.abs(target - x) < (hi - lo) / 3) {
        target =
          target < (lo + hi) / 2
            ? Math.round(pick((lo + hi) / 2, hi))
            : Math.round(pick(lo, (lo + hi) / 2));
      }
      if (Math.abs(target - x) < 8) {
        target = Math.min(hi, Math.max(lo, x + (random() < 0.5 ? -20 : 20)));
      }
      facing = target >= x ? 'right' : 'left';
      // A whole number of hops, without leaving the floor of the room.
      const way = facing === 'right' ? 1 : -1;
      let hops = Math.max(1, Math.round(Math.abs(target - x) / CAT_HOP));
      while (hops > 1 && (x + way * hops * CAT_HOP > hi || x + way * hops * CAT_HOP < lo)) hops--;
      target = x + way * hops * CAT_HOP;
      const end = time + hops * HOP.length * HOP_STEP;
      segment = { start: time, end, pose: 'walk', after, from: x, to: target, facing };
    } else {
      const duration =
        next === 'sleep'
          ? pick(25, 70)
          : next === 'lie'
            ? pick(6, 18)
            : next === 'sit'
              ? pick(5, 14)
              : pick(1.2, 3);
      segment = { start: time, end: time + duration, pose: next, after, from: x, to: x, facing };
    }

    if (now < segment.end) {
      const into = now - segment.start;
      if (segment.pose === 'walk') {
        // Hop after hop: forward only off the floor.
        const steps = Math.floor(into / HOP_STEP);
        const hop = Math.floor(steps / HOP.length);
        const step = HOP[steps % HOP.length]!;
        const way = segment.to >= segment.from ? 1 : -1;
        const at = segment.from + way * (hop * CAT_HOP + step.x);
        return { x: at, pose: 'walk', frame: step.frame, facing };
      }
      const frame = frameOf(segment.pose, segment.after, into);
      return { x: segment.from, pose: segment.pose, frame, facing };
    }

    // What comes next.
    time = segment.end;
    x = segment.to;
    after = segment.pose;
    switch (segment.pose) {
      case 'sleep':
        next = 'lie';
        break;
      case 'lie':
        next = random() < 0.35 ? 'sleep' : 'sit';
        break;
      case 'sit':
        next = random() < 0.35 ? 'lie' : 'stand';
        break;
      case 'stand':
        next = segment.after === 'walk' ? (random() < 0.75 ? 'sit' : 'walk') : 'walk';
        break;
      case 'walk':
        next = 'stand';
        break;
    }
    if (next === 'sit' && random() < 0.4) facing = facing === 'left' ? 'right' : 'left';
  }
  return { x, pose: 'sleep', frame: CAT_FRAMES.sleep[0], facing };
}
