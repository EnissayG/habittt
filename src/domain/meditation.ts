import { MAX_GROWTH_DAYS } from './plant/grid';
import { SPECIES_IDS, type SpeciesId } from './plant/registry';
import type { SeedGenerator } from './ports';

// The meditation corner (docs/meditation.md, ADR 0017 and 0019): a plant grows from
// an empty pot to a grown plant while one breathes, over the whole session.
// Everything here is a function of the time spent in the session, in
// seconds, given by the UI (which pauses it when the app is in the
// background). Nothing is stored.

export type MeditationMinutes = 5 | 10 | 30;

export const MEDITATION_LENGTHS: readonly MeditationMinutes[] = [5, 10, 30];

export interface Meditation {
  minutes: MeditationMinutes;
  seconds: number;
  /** The plant grows `days` days every `every` breaths. */
  growth: { days: number; every: number };
}

/** One breath, in seconds: in, then out. */
export const BREATH = { inhale: 4, exhale: 6 } as const;
export const BREATH_SECONDS = BREATH.inhale + BREATH.exhale;

/**
 * The three sessions. Nothing is written during a session but the word of
 * the breath (see breathWord): no phrase, no advice (ADR 0019).
 */
export const MEDITATIONS: Record<MeditationMinutes, Meditation> = {
  5: { minutes: 5, seconds: 5 * 60, growth: { days: 4, every: 1 } },
  10: { minutes: 10, seconds: 10 * 60, growth: { days: 2, every: 1 } },
  30: { minutes: 30, seconds: 30 * 60, growth: { days: 2, every: 3 } },
};

export interface Breath {
  phase: 'inhale' | 'exhale';
  /** From 0 at the start of the phase towards 1 at its end. */
  progress: number;
  /** Breaths before this one: 0 for the first. */
  number: number;
}

export function breathAt(t: number): Breath {
  const time = Math.max(0, t);
  const number = Math.floor(time / BREATH_SECONDS);
  const within = time - number * BREATH_SECONDS;
  return within < BREATH.inhale
    ? { phase: 'inhale', progress: within / BREATH.inhale, number }
    : { phase: 'exhale', progress: (within - BREATH.inhale) / BREATH.exhale, number };
}

/** Seconds a word of the breath takes to appear, and to fade away. */
export const WORD_FADE = 0.8;

/**
 * The word written under the plant at time t, and how visible it is (0 to
 * 1): "inspire" while breathing in, "expire" while breathing out. Each one
 * appears softly as its part of the breath begins and fades away as it
 * ends, so that one passes into the other with the breath.
 */
export function breathWord(t: number): { word: 'inspire' | 'expire'; opacity: number } {
  const { phase, progress } = breathAt(t);
  const length = phase === 'inhale' ? BREATH.inhale : BREATH.exhale;
  const into = progress * length;
  const left = length - into;
  const opacity = Math.min(1, into / WORD_FADE, left / WORD_FADE);
  // Smoothstep: the fades start and end gently.
  const eased = opacity * opacity * (3 - 2 * opacity);
  return { word: phase === 'inhale' ? 'inspire' : 'expire', opacity: eased };
}

/** How much of the session has passed, from 0 to 1: the incense burns with it. */
export function sessionShare(meditation: Meditation, t: number): number {
  return Math.min(1, Math.max(0, t) / meditation.seconds);
}

/**
 * How full the breath is at time t: 0 with the lungs empty, 1 at the top of
 * the breath in. It starts and stops gently, like a breath, not like a
 * machine: the air around the sun follows it (see drawSun).
 */
export function breathFullness(t: number): number {
  const { phase, progress } = breathAt(t);
  // Smoothstep: only +, - and *, the same on every phone.
  const eased = progress * progress * (3 - 2 * progress);
  return phase === 'inhale' ? eased : 1 - eased;
}

export type PulseStrength = 'soft' | 'light' | 'medium';

export interface BreathPulse {
  /** Seconds from the start of the breath. */
  at: number;
  strength: PulseStrength;
}

/**
 * The breath, for the hand: small taps that come closer and stronger while
 * breathing in, a pause at the top, then taps that space out and fade
 * while breathing out, and silence before the next breath. With the eyes
 * closed, one feels the air come and go, not only when a breath starts.
 */
export const BREATH_PULSES: readonly BreathPulse[] = [
  { at: 0, strength: 'soft' },
  { at: 0.9, strength: 'soft' },
  { at: 1.6, strength: 'light' },
  { at: 2.2, strength: 'light' },
  { at: 2.7, strength: 'medium' },
  { at: 3.1, strength: 'medium' },
  { at: 3.45, strength: 'medium' },
  { at: 4.3, strength: 'medium' },
  { at: 4.8, strength: 'light' },
  { at: 5.4, strength: 'light' },
  { at: 6.1, strength: 'soft' },
  { at: 6.9, strength: 'soft' },
  { at: 7.8, strength: 'soft' },
];

/**
 * The taps due between two beats of the session's clock: after `from`, up
 * to `to` (both in seconds of session). None once the session is over, nor
 * over a jump (the app came back from the background): one does not catch
 * up on missed taps.
 */
export function pulsesBetween(meditation: Meditation, from: number, to: number): BreathPulse[] {
  if (!(to > from) || to - from > 1 || to > meditation.seconds) return [];
  const due: BreathPulse[] = [];
  const first = Math.floor(Math.max(0, from) / BREATH_SECONDS);
  for (let breath = first; breath * BREATH_SECONDS <= to; breath++) {
    for (const pulse of BREATH_PULSES) {
      const at = breath * BREATH_SECONDS + pulse.at;
      // The very first tap of the session is due at its first beat; the
      // breath that would start as the session ends is not taken.
      const after = at > from || (at === 0 && from === 0);
      if (after && at <= to && at < meditation.seconds) due.push(pulse);
    }
  }
  return due;
}

/** Breaths ended so far (the plant grows at the end of each breath out). */
export function breathsDone(meditation: Meditation, t: number): number {
  return Math.floor(Math.min(Math.max(0, t), meditation.seconds) / BREATH_SECONDS);
}

/** Days of the plant after n breaths: 0 at the start, grown at the last breath. */
export function plantDaysAfter(meditation: Meditation, breaths: number): number {
  const { days, every } = meditation.growth;
  return Math.min(MAX_GROWTH_DAYS, Math.floor(Math.max(0, breaths) / every) * days);
}

export function plantDaysAt(meditation: Meditation, t: number): number {
  return plantDaysAfter(meditation, breathsDone(meditation, t));
}

/** "encore N min": the time left, rounded up to the minute. */
export function minutesLeft(meditation: Meditation, t: number): number {
  return Math.ceil(Math.max(0, meditation.seconds - Math.max(0, t)) / 60);
}

export function isOver(meditation: Meditation, t: number): boolean {
  return t >= meditation.seconds;
}

/** The plant of a session, drawn among every species: never kept. */
export function drawMeditationPlant(generateSeed: SeedGenerator): {
  species: SpeciesId;
  seed: number;
} {
  const species = SPECIES_IDS[generateSeed() % SPECIES_IDS.length] ?? SPECIES_IDS[0]!;
  return { species, seed: generateSeed() };
}
