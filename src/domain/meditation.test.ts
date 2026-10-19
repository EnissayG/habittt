import {
  BREATH,
  BREATH_SECONDS,
  BREATH_PULSES,
  breathAt,
  breathFullness,
  breathWord,
  sessionShare,
  WORD_FADE,
  isOver,
  MEDITATION_BONSAI,
  MEDITATION_LENGTHS,
  MEDITATIONS,
  minutesLeft,
  PULSE_GAP,
  pulsesBetween,
} from './meditation';

const ALL = MEDITATION_LENGTHS.map((minutes) => MEDITATIONS[minutes]);

describe('the three meditations', () => {
  it('last 5, 10 and 30 minutes, a whole number of breaths', () => {
    expect(MEDITATION_LENGTHS).toEqual([5, 10, 30]);
    for (const meditation of ALL) {
      expect(meditation.seconds).toBe(meditation.minutes * 60);
      expect(meditation.seconds % BREATH_SECONDS).toBe(0);
    }
  });

  it('write nothing during a session and grow nothing: a length, nothing more', () => {
    for (const meditation of ALL) {
      expect(Object.keys(meditation).sort()).toEqual(['minutes', 'seconds']);
    }
  });

  it('keep the grown bonsai of the opening screen company', () => {
    expect(MEDITATION_BONSAI).toEqual({ species: 'bonsai', seed: 12 });
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

  it('taps quick and even while breathing in, stronger as the lungs fill', () => {
    expect(inhale[0]!.at).toBe(0);
    for (const gap of gaps(inhale.map((pulse) => pulse.at))) expect(gap).toBeCloseTo(PULSE_GAP, 2);
    expect(inhale.length).toBeGreaterThanOrEqual(25);
    for (let i = 1; i < inhale.length; i++) {
      expect(rank[inhale[i]!.strength]).toBeGreaterThanOrEqual(rank[inhale[i - 1]!.strength]);
    }
    expect(inhale[0]!.strength).toBe('soft');
    expect(inhale[inhale.length - 1]!.strength).toBe('medium');
  });

  it('pauses briefly at the top of the breath', () => {
    expect(exhale[0]!.at).toBe(BREATH.inhale);
    expect(exhale[0]!.at - inhale[inhale.length - 1]!.at).toBeGreaterThan(PULSE_GAP);
  });

  it('slows down and softens while breathing out, like air running out, then keeps silent', () => {
    const between = gaps(exhale.map((pulse) => pulse.at));
    expect(between[0]!).toBeCloseTo(PULSE_GAP, 2);
    for (let i = 1; i < between.length; i++) expect(between[i]!).toBeGreaterThan(between[i - 1]!);
    expect(between[between.length - 1]!).toBeGreaterThan(4 * PULSE_GAP);
    for (let i = 1; i < exhale.length; i++) {
      expect(rank[exhale[i]!.strength]).toBeLessThanOrEqual(rank[exhale[i - 1]!.strength]);
    }
    expect(exhale[0]!.strength).toBe('medium');
    expect(exhale[exhale.length - 1]!.strength).toBe('soft');
    expect(BREATH_SECONDS - exhale[exhale.length - 1]!.at).toBeGreaterThanOrEqual(0.5);
  });

  it('is felt in time: the taps of one breath come in order, within the breath', () => {
    const times = BREATH_PULSES.map((pulse) => pulse.at);
    for (const gap of gaps(times)) expect(gap).toBeGreaterThan(0.1);
    expect(times[times.length - 1]!).toBeLessThan(BREATH_SECONDS);
  });

  it('gives every tap exactly once to a clock that beats twenty times a second', () => {
    const meditation = MEDITATIONS[5];
    let count = 0;
    let previous = 0;
    for (let beat = 1; beat <= meditation.seconds * 20; beat++) {
      const t = beat / 20;
      count += pulsesBetween(meditation, previous, t).length;
      previous = t;
    }
    expect(count).toBe((meditation.seconds / BREATH_SECONDS) * BREATH_PULSES.length);
  });

  it('gives them in order, whatever the beat', () => {
    const meditation = MEDITATIONS[5];
    expect(pulsesBetween(meditation, 0, 0.05)).toEqual([BREATH_PULSES[0]]);
    expect(pulsesBetween(meditation, 0.05, 0.1)).toEqual([]);
    expect(pulsesBetween(meditation, 0.1, 0.15)).toEqual([BREATH_PULSES[1]]);
    expect(pulsesBetween(meditation, 9.95, 10.05)).toEqual([BREATH_PULSES[0]]);
    expect(pulsesBetween(meditation, 10.1, 10.3)).toEqual([BREATH_PULSES[1], BREATH_PULSES[2]]);
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
