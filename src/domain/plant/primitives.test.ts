import { fnv1a, mulberry32 } from './random';
import { line, path } from './raster';
import { cos, sin } from './trig';

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

describe('sin and cos', () => {
  it('match Math.sin and Math.cos within 1e-13 on the angles plants use', () => {
    for (let x = -100; x <= 100; x += 0.0137) {
      expect(Math.abs(sin(x) - Math.sin(x))).toBeLessThan(1e-13);
      expect(Math.abs(cos(x) - Math.cos(x))).toBeLessThan(1e-13);
    }
  });

  it('give the cardinal values', () => {
    expect(sin(0)).toBe(0);
    expect(sin(Math.PI / 2)).toBeCloseTo(1, 15);
    expect(cos(0)).toBeCloseTo(1, 15);
    expect(cos(Math.PI)).toBeCloseTo(-1, 15);
  });

  it('are odd and even', () => {
    expect(sin(-1.234)).toBe(-sin(1.234));
    expect(cos(-1.234)).toBeCloseTo(cos(1.234), 15);
  });
});
