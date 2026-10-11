import { MAX_GROWTH_DAYS } from './plant/grid';
import { SPECIES_IDS, type SpeciesId } from './plant/registry';
import type { SeedGenerator } from './ports';

// The meditation corner (docs/meditation.md, ADR 0017): a plant grows from
// an empty pot to a grown plant while one breathes, over the whole session.
// Everything here is a function of the time spent in the session, in
// seconds, given by the UI (which pauses it when the app is in the
// background). Nothing is stored.

export type MeditationMinutes = 5 | 10 | 30;

export const MEDITATION_LENGTHS: readonly MeditationMinutes[] = [5, 10, 30];

export interface MeditationPhrase {
  /** Seconds from the start. */
  at: number;
  text: string;
}

export interface Meditation {
  minutes: MeditationMinutes;
  seconds: number;
  phrases: readonly MeditationPhrase[];
  /** The plant grows `days` days every `every` breaths. */
  growth: { days: number; every: number };
}

/** One breath, in seconds: in, then out. */
export const BREATH = { inhale: 4, exhale: 6 } as const;
export const BREATH_SECONDS = BREATH.inhale + BREATH.exhale;

/** How long a phrase stays on screen, in seconds. */
export const PHRASE_SECONDS = 14;

/** Two lines of the session screen, in characters. */
export const PHRASE_MAX_LENGTH = 72;

/** Shown at the end, before the plant's name. */
export const MEDITATION_END = 'Elle a poussé pendant que tu respirais.';

const INSTALL = "Installe-toi. Il n'y a rien à réussir ici.";
const LIGHT = 'Inspire quand la lumière grandit. Expire quand elle se retire.';
const POT = 'Regarde le pot. Quelque chose y pousse, sans que tu fasses rien.';
const FEET = 'Pose tes pieds. Relâche tes épaules.';
const JAW = 'Relâche ta mâchoire. Ton front. Tes mains.';
const THOUGHT = 'Si une pensée passe, laisse-la passer. Reviens au souffle.';
const UNKNOWN = "Tu ne sais pas encore quelle plante c'est. Ce n'est pas grave.";
const WAVE = "Une envie, c'est comme une vague. Elle monte, puis elle redescend.";
const WATCH_IT = 'Tu peux la regarder passer sans rien faire.';
const EYES = 'Tu peux fermer les yeux. Elle pousse quand même.';
const BACK = "Reviens au souffle, autant de fois qu'il le faut.";
const NOT_FASTER = 'Elle ne pousse pas plus vite si tu la regardes.';
const FEEL = 'Remarque comment tu te sens, sans chercher à changer quoi que ce soit.';
const FEW_MORE = 'Encore quelques souffles, à ton rythme.';
const RETURN = 'Reviens doucement. Regarde ce qui a poussé.';

/** "4:42" -> 282 seconds. */
function at(moment: string, text: string): MeditationPhrase {
  const [minutes, seconds] = moment.split(':').map(Number);
  return { at: minutes! * 60 + seconds!, text };
}

export const MEDITATIONS: Record<MeditationMinutes, Meditation> = {
  5: {
    minutes: 5,
    seconds: 5 * 60,
    growth: { days: 4, every: 1 },
    phrases: [
      at('0:00', INSTALL),
      at('0:25', LIGHT),
      at('0:55', POT),
      at('1:30', FEET),
      at('2:05', THOUGHT),
      at('2:40', UNKNOWN),
      at('3:15', WAVE),
      at('3:50', EYES),
      at('4:20', FEW_MORE),
      at('4:42', RETURN),
    ],
  },
  10: {
    minutes: 10,
    seconds: 10 * 60,
    growth: { days: 2, every: 1 },
    phrases: [
      at('0:00', INSTALL),
      at('0:25', LIGHT),
      at('0:55', POT),
      at('1:35', FEET),
      at('2:15', JAW),
      at('3:00', THOUGHT),
      at('3:50', UNKNOWN),
      at('4:40', EYES),
      at('5:30', WAVE),
      at('6:20', WATCH_IT),
      at('7:10', BACK),
      at('8:00', NOT_FASTER),
      at('8:50', FEEL),
      at('9:22', FEW_MORE),
      at('9:42', RETURN),
    ],
  },
  30: {
    minutes: 30,
    seconds: 30 * 60,
    growth: { days: 2, every: 3 },
    phrases: [
      at('0:00', INSTALL),
      at('0:30', LIGHT),
      at('1:05', POT),
      at('2:00', FEET),
      at('3:00', JAW),
      at('4:15', 'Parfois, rien ne se voit. Ça pousse quand même.'),
      at('5:30', 'Porte ton attention sur tes pieds, puis remonte lentement.'),
      at('6:45', 'Tes jambes. Ton ventre. Ton dos contre le fauteuil.'),
      at('8:00', 'Ta poitrine qui se soulève. Tes épaules. Ta nuque.'),
      at('9:30', EYES),
      at('11:30', THOUGHT),
      at('13:30', 'Écoute les bruits de la pièce, sans les suivre.'),
      at('15:00', 'Tu es à la moitié. Rien ne presse.'),
      at('16:30', WAVE),
      at('18:00', WATCH_IT),
      at('20:00', BACK),
      at('22:00', "Si tu t'es perdu dans tes pensées, ce n'est rien. Reviens."),
      at('24:00', NOT_FASTER),
      at('26:00', FEEL),
      at('27:45', "Pense à une chose, même petite, qui t'a fait du bien aujourd'hui."),
      at('29:00', FEW_MORE),
      at('29:38', RETURN),
    ],
  },
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

/**
 * How full the breath is at time t: 0 with the lungs empty, 1 at the top of
 * the breath in. It starts and stops gently, like a breath, not like a
 * machine: the light behind the plant follows it (see drawHalo).
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

/** The phrase on screen at time t, or null: between two phrases there is nothing to read. */
export function phraseAt(meditation: Meditation, t: number): string | null {
  if (t < 0 || t >= meditation.seconds) return null;
  for (let i = meditation.phrases.length - 1; i >= 0; i--) {
    const phrase = meditation.phrases[i]!;
    if (phrase.at <= t) return t < phrase.at + PHRASE_SECONDS ? phrase.text : null;
  }
  return null;
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
