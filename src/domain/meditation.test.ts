import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BREATH,
  BREATH_SECONDS,
  breathAt,
  breathLevel,
  breathsDone,
  drawMeditationPlant,
  isOver,
  MEDITATION_END,
  MEDITATION_LENGTHS,
  MEDITATIONS,
  minutesLeft,
  phraseAt,
  PHRASE_MAX_LENGTH,
  PHRASE_SECONDS,
  plantDaysAfter,
  plantDaysAt,
} from './meditation';
import { MAX_GROWTH_DAYS } from './plant/grid';
import { SPECIES_IDS } from './plant/registry';

/** The tables of docs/meditation.md, the reference for the texts: minutes -> [seconds, text]. */
function specTables(): Map<number, [number, string][]> {
  const text = readFileSync(join(__dirname, '../../docs/meditation.md'), 'utf8');
  const tables = new Map<number, [number, string][]>();
  let current: [number, string][] | null = null;
  for (const line of text.split('\n')) {
    const title = /^### (\d+) minutes/.exec(line);
    if (title) {
      current = [];
      tables.set(Number(title[1]), current);
      continue;
    }
    if (line.startsWith('#')) current = null;
    const row = /^\|\s*(\d+):(\d\d)\s*\|\s*(.+?)\s*\|$/.exec(line);
    if (row && current) current.push([Number(row[1]) * 60 + Number(row[2]), row[3]!]);
  }
  return tables;
}

const ALL = MEDITATION_LENGTHS.map((minutes) => MEDITATIONS[minutes]);

describe('the three meditations', () => {
  it('last 5, 10 and 30 minutes, a whole number of breaths', () => {
    expect(MEDITATION_LENGTHS).toEqual([5, 10, 30]);
    for (const meditation of ALL) {
      expect(meditation.seconds).toBe(meditation.minutes * 60);
      expect(meditation.seconds % BREATH_SECONDS).toBe(0);
    }
  });

  it('take their phrases word for word from docs/meditation.md', () => {
    const tables = specTables();
    expect([...tables.keys()]).toEqual([5, 10, 30]);
    for (const meditation of ALL) {
      expect(meditation.phrases.map(({ at, text }) => [at, text])).toEqual(
        tables.get(meditation.minutes),
      );
    }
  });

  it('start at 0:00, with phrases in increasing order', () => {
    for (const { phrases } of ALL) {
      expect(phrases[0]!.at).toBe(0);
      phrases.slice(1).forEach((phrase, i) => expect(phrase.at).toBeGreaterThan(phrases[i]!.at));
    }
  });

  it('show each phrase in full before the next one and before the end', () => {
    for (const { phrases, seconds } of ALL) {
      phrases.forEach((phrase, i) => {
        const next = phrases[i + 1]?.at ?? seconds;
        expect(phrase.at + PHRASE_SECONDS).toBeLessThanOrEqual(next);
      });
    }
  });

  it('never write a phrase longer than two lines', () => {
    for (const { phrases } of ALL) {
      for (const { text } of phrases) expect(text.length).toBeLessThanOrEqual(PHRASE_MAX_LENGTH);
    }
    expect(MEDITATION_END.length).toBeLessThanOrEqual(PHRASE_MAX_LENGTH);
  });

  it('end with the words of the spec', () => {
    expect(MEDITATION_END).toBe('Elle a poussé pendant que tu respirais.');
  });
});

describe('the breath', () => {
  it('lasts ten seconds: four to breathe in, six to breathe out', () => {
    expect(BREATH).toEqual({ inhale: 4, exhale: 6 });
    expect(BREATH_SECONDS).toBe(10);
  });

  it('breathes in, then out, and starts again', () => {
    expect(breathAt(0)).toEqual({ phase: 'inhale', progress: 0, number: 0 });
    expect(breathAt(2)).toEqual({ phase: 'inhale', progress: 0.5, number: 0 });
    expect(breathAt(4)).toEqual({ phase: 'exhale', progress: 0, number: 0 });
    expect(breathAt(7)).toEqual({ phase: 'exhale', progress: 0.5, number: 0 });
    expect(breathAt(10)).toEqual({ phase: 'inhale', progress: 0, number: 1 });
    expect(breathAt(123)).toEqual({ phase: 'inhale', progress: 0.75, number: 12 });
  });

  it('progresses from 0 towards 1 within each phase', () => {
    let previous = breathAt(0);
    for (let t = 0.1; t < 30; t += 0.1) {
      const breath = breathAt(t);
      expect(breath.progress).toBeGreaterThanOrEqual(0);
      expect(breath.progress).toBeLessThan(1);
      if (breath.phase === previous.phase && breath.number === previous.number) {
        expect(breath.progress).toBeGreaterThanOrEqual(previous.progress);
      }
      previous = breath;
    }
  });

  it('fills the bar step by step while breathing in, and empties it while breathing out', () => {
    expect(breathLevel(0, 12)).toBe(0);
    expect(breathLevel(2, 12)).toBe(6);
    expect(breathLevel(4, 12)).toBe(12);
    expect(breathLevel(7, 12)).toBe(6);
    expect(breathLevel(9.99, 12)).toBe(0);
    expect(breathLevel(10, 12)).toBe(0);
    for (let t = 0; t < 20; t += 0.05) {
      const level = breathLevel(t, 12);
      expect(Number.isInteger(level)).toBe(true);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(12);
    }
  });
});

describe('the plant of a meditation', () => {
  it('starts as an empty pot', () => {
    for (const meditation of ALL) {
      expect(plantDaysAfter(meditation, 0)).toBe(0);
      expect(plantDaysAt(meditation, 0)).toBe(0);
    }
  });

  it('is grown exactly at the last breath, not before', () => {
    for (const meditation of ALL) {
      const breaths = meditation.seconds / BREATH_SECONDS;
      expect(plantDaysAfter(meditation, breaths)).toBe(MAX_GROWTH_DAYS);
      expect(plantDaysAfter(meditation, breaths - 1)).toBeLessThan(MAX_GROWTH_DAYS);
      expect(plantDaysAt(meditation, meditation.seconds)).toBe(MAX_GROWTH_DAYS);
      expect(plantDaysAt(meditation, meditation.seconds - 0.01)).toBeLessThan(MAX_GROWTH_DAYS);
    }
  });

  it('never shrinks, and never grows beyond a grown plant', () => {
    for (const meditation of ALL) {
      let previous = 0;
      for (let n = 0; n <= meditation.seconds / BREATH_SECONDS + 5; n++) {
        const days = plantDaysAfter(meditation, n);
        expect(days).toBeGreaterThanOrEqual(previous);
        expect(days).toBeLessThanOrEqual(MAX_GROWTH_DAYS);
        previous = days;
      }
    }
  });

  it('grows four days a breath in 5 minutes, two in 10, two every three breaths in 30', () => {
    expect([1, 2, 3].map((n) => plantDaysAfter(MEDITATIONS[5], n))).toEqual([4, 8, 12]);
    expect([1, 2, 3].map((n) => plantDaysAfter(MEDITATIONS[10], n))).toEqual([2, 4, 6]);
    expect([1, 2, 3, 4, 5, 6].map((n) => plantDaysAfter(MEDITATIONS[30], n))).toEqual([
      0, 0, 2, 2, 2, 4,
    ]);
  });

  it('grows at the end of each breath out', () => {
    const meditation = MEDITATIONS[5];
    expect(breathsDone(meditation, 9.99)).toBe(0);
    expect(breathsDone(meditation, 10)).toBe(1);
    expect(plantDaysAt(meditation, 9.99)).toBe(0);
    expect(plantDaysAt(meditation, 10)).toBe(4);
    expect(breathsDone(meditation, meditation.seconds + 60)).toBe(30);
  });

  it('is drawn among the thirteen species with the injected seeds', () => {
    const seeds = [15, 987654321];
    const plant = drawMeditationPlant(() => seeds.shift()!);
    expect(plant).toEqual({ species: SPECIES_IDS[15 % SPECIES_IDS.length], seed: 987654321 });
    for (let s = 0; s < 40; s++) {
      expect(SPECIES_IDS).toContain(drawMeditationPlant(() => s).species);
    }
  });
});

describe('phraseAt', () => {
  const meditation = MEDITATIONS[5];

  it('shows a phrase for fourteen seconds, then nothing until the next one', () => {
    expect(phraseAt(meditation, 0)).toBe("Installe-toi. Il n'y a rien à réussir ici.");
    expect(phraseAt(meditation, 13.9)).toBe(phraseAt(meditation, 0));
    expect(phraseAt(meditation, 14)).toBeNull();
    expect(phraseAt(meditation, 24.9)).toBeNull();
    expect(phraseAt(meditation, 25)).toBe(
      'Inspire quand la barre se remplit. Expire quand elle se vide.',
    );
  });

  it('shows the last phrase until the end, then nothing', () => {
    expect(phraseAt(meditation, 4 * 60 + 42)).toBe('Reviens doucement. Regarde ce qui a poussé.');
    expect(phraseAt(meditation, meditation.seconds)).toBeNull();
  });
});

describe('the time left', () => {
  it('is rounded up to the minute', () => {
    const meditation = MEDITATIONS[5];
    expect(minutesLeft(meditation, 0)).toBe(5);
    expect(minutesLeft(meditation, 1)).toBe(5);
    expect(minutesLeft(meditation, 60)).toBe(4);
    expect(minutesLeft(meditation, 61)).toBe(4);
    expect(minutesLeft(meditation, 299)).toBe(1);
    expect(minutesLeft(meditation, 300)).toBe(0);
    expect(minutesLeft(meditation, 400)).toBe(0);
    expect(minutesLeft(MEDITATIONS[30], 0)).toBe(30);
  });

  it('runs out when the meditation is over', () => {
    const meditation = MEDITATIONS[10];
    expect(isOver(meditation, 599.9)).toBe(false);
    expect(isOver(meditation, 600)).toBe(true);
  });
});
