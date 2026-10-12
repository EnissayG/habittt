import {
  BREATH,
  BREATH_SECONDS,
  BREATH_PULSES,
  breathAt,
  breathFullness,
  breathWord,
  sessionShare,
  WORD_FADE,
  breathsDone,
  drawMeditationPlant,
  isOver,
  MEDITATION_LENGTHS,
  MEDITATIONS,
  minutesLeft,
  plantDaysAfter,
  plantDaysAt,
  pulsesBetween,
} from './meditation';
import { MAX_GROWTH_DAYS } from './plant/grid';
import { SPECIES_IDS } from './plant/registry';

const ALL = MEDITATION_LENGTHS.map((minutes) => MEDITATIONS[minutes]);

describe('the three meditations', () => {
  it('last 5, 10 and 30 minutes, a whole number of breaths', () => {
    expect(MEDITATION_LENGTHS).toEqual([5, 10, 30]);
    for (const meditation of ALL) {
      expect(meditation.seconds).toBe(meditation.minutes * 60);
      expect(meditation.seconds % BREATH_SECONDS).toBe(0);
    }
  });

  it('write nothing during a session: no phrase, no advice', () => {
    for (const meditation of ALL) {
      expect(Object.keys(meditation).sort()).toEqual(['growth', 'minutes', 'seconds']);
    }
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

  it('is empty at the start, full at the top of the breath in, empty again at the end', () => {
    expect(breathFullness(0)).toBe(0);
    expect(breathFullness(2)).toBeCloseTo(0.5);
    expect(breathFullness(BREATH.inhale)).toBe(1);
    expect(breathFullness(BREATH.inhale + BREATH.exhale / 2)).toBeCloseTo(0.5);
    expect(breathFullness(BREATH_SECONDS)).toBe(0);
    expect(breathFullness(BREATH_SECONDS - 0.001)).toBeLessThan(0.001);
  });

  it('fills while breathing in and empties while breathing out, never jumping', () => {
    const step = 0.05;
    for (let t = step; t < 3 * BREATH_SECONDS; t += step) {
      const now = breathFullness(t);
      const before = breathFullness(t - step);
      expect(now).toBeGreaterThanOrEqual(0);
      expect(now).toBeLessThanOrEqual(1);
      expect(Math.abs(now - before)).toBeLessThan(0.03);
      const { phase } = breathAt(t - step / 2);
      if (breathAt(t).number !== breathAt(t - step).number) continue;
      if (phase === 'inhale') expect(now).toBeGreaterThanOrEqual(before);
      else expect(now).toBeLessThanOrEqual(before);
    }
  });

  it('starts and stops gently: slower at both ends than in the middle', () => {
    const speed = (t: number) => Math.abs(breathFullness(t + 0.1) - breathFullness(t));
    expect(speed(0)).toBeLessThan(speed(1.9) / 3);
    expect(speed(3.9)).toBeLessThan(speed(1.9) / 3);
    expect(speed(4)).toBeLessThan(speed(6.9) / 3);
  });
});

describe('the breath, for the hand', () => {
  const gaps = (times: number[]) => times.slice(1).map((time, i) => time - times[i]!);
  const inhale = BREATH_PULSES.filter((pulse) => pulse.at < BREATH.inhale);
  const exhale = BREATH_PULSES.filter((pulse) => pulse.at >= BREATH.inhale);
  const rank = { soft: 0, light: 1, medium: 2 };

  it('taps closer and stronger while breathing in', () => {
    expect(inhale[0]!.at).toBe(0);
    const between = gaps(inhale.map((pulse) => pulse.at));
    for (let i = 1; i < between.length; i++) expect(between[i]!).toBeLessThan(between[i - 1]!);
    for (let i = 1; i < inhale.length; i++) {
      expect(rank[inhale[i]!.strength]).toBeGreaterThanOrEqual(rank[inhale[i - 1]!.strength]);
    }
    expect(inhale[0]!.strength).toBe('soft');
    expect(inhale[inhale.length - 1]!.strength).toBe('medium');
  });

  it('holds still at the top of the breath', () => {
    expect(exhale[0]!.at - inhale[inhale.length - 1]!.at).toBeGreaterThan(0.7);
    expect(exhale[0]!.at).toBeGreaterThan(BREATH.inhale);
  });

  it('spaces out and fades while breathing out, then keeps silent', () => {
    const between = gaps(exhale.map((pulse) => pulse.at));
    for (let i = 1; i < between.length; i++) expect(between[i]!).toBeGreaterThan(between[i - 1]!);
    for (let i = 1; i < exhale.length; i++) {
      expect(rank[exhale[i]!.strength]).toBeLessThanOrEqual(rank[exhale[i - 1]!.strength]);
    }
    expect(exhale[exhale.length - 1]!.strength).toBe('soft');
    expect(BREATH_SECONDS - exhale[exhale.length - 1]!.at).toBeGreaterThanOrEqual(2);
  });

  it('gives every tap exactly once to a clock that beats ten times a second', () => {
    const meditation = MEDITATIONS[5];
    let count = 0;
    let previous = 0;
    for (let beat = 1; beat <= meditation.seconds * 10; beat++) {
      const t = beat / 10;
      count += pulsesBetween(meditation, previous, t).length;
      previous = t;
    }
    expect(count).toBe((meditation.seconds / BREATH_SECONDS) * BREATH_PULSES.length);
  });

  it('gives them in order, whatever the beat', () => {
    const meditation = MEDITATIONS[5];
    expect(pulsesBetween(meditation, 0, 0.1)).toEqual([BREATH_PULSES[0]]);
    expect(pulsesBetween(meditation, 0.1, 0.8)).toEqual([]);
    expect(pulsesBetween(meditation, 0.8, 1.0)).toEqual([BREATH_PULSES[1]]);
    expect(pulsesBetween(meditation, 9.95, 10.05)).toEqual([BREATH_PULSES[0]]);
    expect(pulsesBetween(meditation, 12.6, 13.2)).toEqual([BREATH_PULSES[4], BREATH_PULSES[5]]);
  });

  it('does not catch up after a pause, and stops with the session', () => {
    const meditation = MEDITATIONS[5];
    expect(pulsesBetween(meditation, 3, 60)).toEqual([]);
    expect(pulsesBetween(meditation, 5, 5)).toEqual([]);
    expect(pulsesBetween(meditation, 5, 4)).toEqual([]);
    expect(pulsesBetween(meditation, meditation.seconds - 0.05, meditation.seconds + 0.05)).toEqual(
      [],
    );
    expect(pulsesBetween(meditation, meditation.seconds + 1, meditation.seconds + 1.1)).toEqual([]);
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

describe('the word of the breath', () => {
  it('says inspire while breathing in, expire while breathing out', () => {
    for (let t = 0.05; t < 30; t += 0.1) {
      expect(breathWord(t).word).toBe(breathAt(t).phase === 'inhale' ? 'inspire' : 'expire');
    }
  });

  it('appears softly as its part of the breath begins, and fades as it ends', () => {
    expect(breathWord(0).opacity).toBe(0);
    expect(breathWord(WORD_FADE / 2).opacity).toBeCloseTo(0.5);
    expect(breathWord(WORD_FADE).opacity).toBe(1);
    expect(breathWord(2).opacity).toBe(1);
    expect(breathWord(BREATH.inhale - 0.001).opacity).toBeLessThan(0.01);
    expect(breathWord(BREATH.inhale).opacity).toBe(0);
    expect(breathWord(BREATH.inhale + 3).opacity).toBe(1);
    expect(breathWord(BREATH_SECONDS - 0.001).opacity).toBeLessThan(0.01);
  });

  it('never jumps: the two words pass into each other with the breath', () => {
    const step = 0.02;
    for (let t = step; t < 3 * BREATH_SECONDS; t += step) {
      const now = breathWord(t);
      const before = breathWord(t - step);
      expect(now.opacity).toBeGreaterThanOrEqual(0);
      expect(now.opacity).toBeLessThanOrEqual(1);
      // A word only changes when it is invisible.
      if (now.word !== before.word)
        expect(Math.max(now.opacity, before.opacity)).toBeLessThan(0.02);
      else expect(Math.abs(now.opacity - before.opacity)).toBeLessThan(0.05);
    }
  });
});

describe('the time of the session', () => {
  it('goes from 0 to 1, and stays there', () => {
    const meditation = MEDITATIONS[10];
    expect(sessionShare(meditation, -4)).toBe(0);
    expect(sessionShare(meditation, 0)).toBe(0);
    expect(sessionShare(meditation, 300)).toBe(0.5);
    expect(sessionShare(meditation, 600)).toBe(1);
    expect(sessionShare(meditation, 900)).toBe(1);
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
