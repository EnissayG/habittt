import type { SpeciesId } from './plant/registry';

// The meditation corner (docs/meditation.md, ADR 0017 to 0020): one breathes
// with the sun, beside a grown bonsai, while a stick of incense burns down.
// Everything here is a function of the time spent in the session, in
// seconds, given by the UI (which pauses it when the app is in the
// background). Nothing is stored.

/** The plant of every session: the grown bonsai of the opening screen, already there. */
export const MEDITATION_BONSAI: { species: SpeciesId; seed: number } = {
  species: 'bonsai',
  seed: 12,
};

export type MeditationMinutes = 5 | 10 | 30;

export const MEDITATION_LENGTHS: readonly MeditationMinutes[] = [5, 10, 30];

export interface Meditation {
  minutes: MeditationMinutes;
  seconds: number;
}

/** One breath, in seconds: in, then out. */
export const BREATH = { inhale: 4, exhale: 6 } as const;
export const BREATH_SECONDS = BREATH.inhale + BREATH.exhale;

/**
 * The three sessions. Nothing is written during a session but the word of
 * the breath (see breathWord): no phrase, no advice (ADR 0019).
 */
export const MEDITATIONS: Record<MeditationMinutes, Meditation> = {
  5: { minutes: 5, seconds: 5 * 60 },
  10: { minutes: 10, seconds: 10 * 60 },
  30: { minutes: 30, seconds: 30 * 60 },
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

/** Seconds between two taps while breathing in, and at the start of the breath out. */
export const PULSE_GAP = 0.13;
/** Each gap of the breath out is this much longer than the one before. */
const EXHALE_SLOWING = 1.18;
/** Silence kept at the top of the breath, and before the next breath in. */
const TOP_PAUSE = 0.2;
const LAST_SILENCE = 0.7;

/** Seconds rounded to the millisecond: the same list on every phone. */
const ms = (seconds: number) => Math.round(seconds * 1000) / 1000;

/** The taps of one breath, computed once (see BREATH_PULSES). */
function lungTaps(): BreathPulse[] {
  const taps: BreathPulse[] = [];
  // Breathing in: quick, even taps, as the lungs fill fast, stronger as they fill.
  const inEnd = BREATH.inhale - TOP_PAUSE;
  for (let at = 0; at <= inEnd + 1e-9; at += PULSE_GAP) {
    const share = at / inEnd;
    taps.push({ at: ms(at), strength: share < 0.35 ? 'soft' : share < 0.75 ? 'light' : 'medium' });
  }
  // Breathing out: the same quick taps at first, then each gap a little
  // longer, as the air slows down leaving the lungs, softer and softer.
  const outEnd = BREATH_SECONDS - LAST_SILENCE;
  let gap = PULSE_GAP;
  for (let at = BREATH.inhale; at <= outEnd + 1e-9; at += gap, gap *= EXHALE_SLOWING) {
    const share = (at - BREATH.inhale) / (outEnd - BREATH.inhale);
    taps.push({ at: ms(at), strength: share < 0.25 ? 'medium' : share < 0.6 ? 'light' : 'soft' });
  }
  return taps;
}

/**
 * The breath, for the hand, like the lungs: breathing in, quick and even
 * taps that grow stronger; a short pause at the top; breathing out, taps
 * that start just as quick, then slow down and soften, like air running
 * out; a moment of silence before the next breath. With the eyes closed,
 * one feels the air come in fast and go out slowly.
 */
export const BREATH_PULSES: readonly BreathPulse[] = lungTaps();

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

/** "encore N min": the time left, rounded up to the minute. */
export function minutesLeft(meditation: Meditation, t: number): number {
  return Math.ceil(Math.max(0, meditation.seconds - Math.max(0, t)) / 60);
}

export function isOver(meditation: Meditation, t: number): boolean {
  return t >= meditation.seconds;
}
