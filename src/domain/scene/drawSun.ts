import { sin } from '../plant/trig';
import { SceneCanvas, type SceneImage } from './sceneImage';

// The sun of the meditation corner, above the plant of the session (ADR
// 0019). It is the breath made visible: its heart never changes, and the
// warm air around it spreads out as one breathes in and gathers back as one
// breathes out, in rippling waves.

/** The sun of a meditation: its heart keeps its size, the air around it breathes. */
export const SUN = {
  /** Its own grid, above the plant: the plant never hides it. */
  width: 48,
  height: 46,
  /** Radius of the heart, in cells: it never changes. */
  heart: 5,
  /** How far the warm air reaches, lungs empty and full. */
  air: { min: 9, max: 20 },
  /** Width of one wave of air, in cells. */
  wave: 3,
} as const;

/**
 * The sun above the plant at time t, for a breath this full (0 to 1, see
 * breathFullness). Its heart keeps its size. Around it, the air: rings of
 * warm light, each a little paler than the one inside, whose edges ripple
 * like waves. Breathing in, the air spreads out and the waves move outwards;
 * breathing out, it gathers back towards the heart. The outermost wave
 * dissolves into the wall, one cell out of two.
 */
export function drawSun(fullness: number, t = 0): SceneImage {
  const { width, height } = SUN;
  const c = new SceneCanvas(width, height);
  const f = Math.min(1, Math.max(0, fullness));
  const cx = width / 2;
  const cy = height / 2;
  const reach = SUN.air.min + f * (SUN.air.max - SUN.air.min);
  // The waves travel outwards with the breath in, back with the breath out.
  const drift = f * SUN.wave * 2;
  const tones = ['sunGlow', 'airA', 'airB', 'airC'] as const;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= SUN.heart) {
        c.fill(x, y, 1, 1, 'sunHeart');
        continue;
      }
      // The edges of the air ripple: two slow waves that go round the sun
      // (from the direction of the cell, without trigonometry beyond trig.ts).
      const u = dx / d;
      const v = dy / d;
      const ripple = 1.2 * sin(4 * u + 2 * v + t * 0.8) + 0.7 * sin(3 * v - 2 * u - t * 0.5);
      const edge = reach + ripple;
      if (d > edge) continue;
      // Rings of air: their boundaries ripple too, and move with the breath.
      const ring = Math.floor((d - SUN.heart + ripple * 0.6 - drift) / SUN.wave);
      const depth = Math.min(
        tones.length - 1,
        Math.max(0, Math.floor(((d - SUN.heart) / (edge - SUN.heart)) * tones.length)),
      );
      // Every other ring is a step paler: the waves.
      const tone = tones[Math.min(tones.length - 1, depth + (((ring % 2) + 2) % 2))]!;
      // The last cell before the wall: one out of two.
      if (edge - d < 1 && (x + y) % 2 === 1) continue;
      c.fill(x, y, 1, 1, tone);
    }
  }
  return c.toImage();
}

/** Seconds a sparkle of the end takes to shine and go out. */
export const SPARKLE_CYCLE = 1.6;
/** Sparkles of the end, and the delay between the first appearance of two of them. */
const SPARKLES = 12;
const SPARKLE_DELAY = 0.2;

/**
 * The end of a session, for a well done: small stars of light that come one
 * after the other around the sun and the bonsai, each shining and going out
 * at its own pace. Their places are drawn from a fixed sequence, the same
 * every time; t is the time since the end, in seconds.
 */
export function drawSparkles(width: number, height: number, t: number): SceneImage {
  const c = new SceneCanvas(width, height);
  let state = 2166136261;
  const next = () => {
    // A small linear congruential sequence: integers only, the same everywhere.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = 0; i < SPARKLES; i++) {
    const x = 3 + Math.floor(next() * (width - 6));
    const y = 3 + Math.floor(next() * (height - 6));
    const offset = next() * SPARKLE_CYCLE;
    const since = t - i * SPARKLE_DELAY;
    if (since < 0) continue;
    const phase = ((since + offset) % SPARKLE_CYCLE) / SPARKLE_CYCLE;
    // Out, a dot, a small cross, a large cross, the small one again, out.
    const arm =
      phase < 0.2
        ? -1
        : phase < 0.35
          ? 0
          : phase < 0.5
            ? 1
            : phase < 0.65
              ? 2
              : phase < 0.8
                ? 1
                : -1;
    if (arm < 0) continue;
    c.fill(x, y, 1, 1, 'sunHeart');
    for (let k = 1; k <= arm; k++) {
      const tone = k === arm ? 'airA' : 'sunGlow';
      c.fill(x - k, y, 1, 1, tone);
      c.fill(x + k, y, 1, 1, tone);
      c.fill(x, y - k, 1, 1, tone);
      c.fill(x, y + k, 1, 1, tone);
    }
  }
  return c.toImage();
}
