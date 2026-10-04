import { fnv1a, mulberry32 } from './random';
import { line, path } from './raster';
import { cosSteps, radiansToSteps, sinSteps, STEPS_PER_TURN } from './trig';

// Reference values were produced by the JavaScript prototype
// (docs/prototypes/plants.js), so the port is checked against it.

describe('mulberry32', () => {
  it('matches the prototype sequence', () => {
    const random = mulberry32(12345);
    expect([random(), random(), random()]).toEqual([
      0.9797282677609473, 0.3067522644996643, 0.484205421525985,
    ]);
    const zero = mulberry32(0);
    expect([zero(), zero()]).toEqual([0.26642920868471265, 0.0003297457005828619]);
  });

  it('stays in [0, 1)', () => {
    const random = mulberry32(42);
    for (let i = 0; i < 10_000; i++) {
      const value = random();
      expect(value >= 0 && value < 1).toBe(true);
    }
  });
});

describe('fnv1a', () => {
  it('matches the prototype hash', () => {
    expect(fnv1a('')).toBe(2166136261);
    expect(fnv1a('monstera')).toBe(4269791696);
    expect(fnv1a('pothos')).toBe(1724017550);
  });
});

describe('line', () => {
  it('matches the prototype Bresenham segments', () => {
    expect(line(0, 0, 5, 2)).toEqual([
      [0, 0],
      [1, 0],
      [2, 1],
      [3, 1],
      [4, 2],
      [5, 2],
    ]);
    expect(line(3, 3, 3, -1)).toEqual([
      [3, 3],
      [3, 2],
      [3, 1],
      [3, 0],
      [3, -1],
    ]);
  });

  it('rounds non-integer ends first', () => {
    expect(line(2.4, 0, -1.6, 1)).toEqual([
      [2, 0],
      [1, 0],
      [0, 1],
      [-1, 1],
      [-2, 1],
    ]);
  });

  it('is a single cell when both ends coincide', () => {
    expect(line(1, 1, 1, 1)).toEqual([[1, 1]]);
  });
});

describe('path', () => {
  it('joins segments without repeating the shared points', () => {
    expect(
      path([
        [0, 0],
        [2, 0],
        [2, 2],
      ]),
    ).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ]);
  });
});

describe('trig table', () => {
  it('approximates Math.sin and Math.cos within 1e-6', () => {
    for (let step = -STEPS_PER_TURN; step <= STEPS_PER_TURN; step++) {
      const radians = (2 * Math.PI * step) / STEPS_PER_TURN;
      expect(Math.abs(sinSteps(step) - Math.sin(radians))).toBeLessThan(1e-6);
      expect(Math.abs(cosSteps(step) - Math.cos(radians))).toBeLessThan(1e-6);
    }
  });

  it('has exact cardinal values', () => {
    expect(sinSteps(16)).toBe(1);
    expect(cosSteps(32)).toBe(-1);
    expect(sinSteps(0)).toBe(0);
  });

  it('converts radians to the nearest step', () => {
    expect(radiansToSteps(-Math.PI / 2)).toBe(-16);
    expect(radiansToSteps(0.45)).toBe(5);
  });
});
