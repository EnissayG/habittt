import { drawPlaque, glintAt, PLAQUE_METALS, PLAQUE_MIN, plaqueShine, plaqueTier } from './plaque';

const toneAt = (image: ReturnType<typeof drawPlaque>, x: number, y: number) =>
  image.pixels[y * image.width + x]?.tone ?? null;

describe('plaqueTier', () => {
  it('grows finer with the days of the life: bronze, silver, gold, platinum, opal', () => {
    expect([0, 29, 30, 89, 90, 179, 180, 364, 365, 1000].map((d) => plaqueTier(d, false))).toEqual([
      'bronze',
      'bronze',
      'silver',
      'silver',
      'gold',
      'gold',
      'platinum',
      'platinum',
      'opal',
      'opal',
    ]);
    expect(PLAQUE_METALS.map((step) => step.from)).toEqual([0, 30, 90, 180, 365]);
  });

  it('is tarnished once the plant did not hold, whatever its days', () => {
    expect(plaqueTier(400, true)).toBe('tarnished');
    expect(plaqueTier(0, true)).toBe('tarnished');
  });
});

describe('drawPlaque', () => {
  it('frames the wood with its metal, lit at the top left, shaded at the bottom right', () => {
    const plaque = drawPlaque('gold', 40, 14);
    expect(plaque.width).toBe(40);
    expect(plaque.height).toBe(14);
    expect(toneAt(plaque, 5, 0)).toBe('goldLight');
    expect(toneAt(plaque, 0, 7)).toBe('goldLight');
    expect(toneAt(plaque, 20, 13)).toBe('goldShade');
    expect(toneAt(plaque, 39, 7)).toBe('goldShade');
    expect(toneAt(plaque, 5, 1)).toBe('gold');
    expect(toneAt(plaque, 2, 2)).toBe('goldLight'); // a rivet
    expect(toneAt(plaque, 3, 2)).toBe('gold'); // its bracket
    expect(['plaqueWood', 'plaqueWoodGrain']).toContain(toneAt(plaque, 20, 7));
    // Rounded corners: the four outermost cells stay empty.
    expect([
      toneAt(plaque, 0, 0),
      toneAt(plaque, 39, 0),
      toneAt(plaque, 0, 13),
      toneAt(plaque, 39, 13),
    ]).toEqual([null, null, null, null]);
    expect(plaque.pixels.filter((pixel) => !pixel)).toHaveLength(4);
  });

  it('gives each metal its own frame, and a free place a plain board', () => {
    const frame = (tier: Parameters<typeof drawPlaque>[0]) =>
      toneAt(drawPlaque(tier, 40, 14), 5, 0);
    expect(
      new Set(
        ['bronze', 'silver', 'gold', 'platinum', 'opal', 'tarnished'].map((t) => frame(t as never)),
      ).size,
    ).toBe(6);
    const board = drawPlaque('wood', 40, 14);
    expect(
      board.pixels.every((pixel) => pixel === null || pixel.tone!.startsWith('plaqueWood')),
    ).toBe(true);
  });

  it('hangs from two short chains of its metal, under a shelf', () => {
    const plaque = drawPlaque('silver', 40, 17, true);
    expect(plaque.height).toBe(17);
    const chains = [...Array(40).keys()].filter((x) => toneAt(plaque, x, 0) !== null);
    expect(chains).toHaveLength(2);
    expect(['silver', 'silverShade']).toContain(toneAt(plaque, chains[0]!, 1));
    // The board starts under the chains, with its rounded corner.
    expect(toneAt(plaque, 0, 3)).toBeNull();
    expect(toneAt(plaque, 5, 3)).toBe('silverLight');
    const iron = drawPlaque('wood', 40, 17, true);
    expect(toneAt(iron, chains[0]!, 0)).toBe('plaqueIron');
  });

  it('never gets smaller than its frame needs', () => {
    const tiny = drawPlaque('silver', 3, 2);
    expect([tiny.width, tiny.height]).toEqual([PLAQUE_MIN.width, PLAQUE_MIN.height]);
  });
});

describe('plaqueShine and glintAt', () => {
  /** Seconds a plaque spends glinting over a long time, alone or among others. */
  const shining = (tier: Parameters<typeof plaqueShine>[0], index = 0, count = 1) => {
    let frames = 0;
    for (let t = 0; t < 600; t += 0.1) {
      if (plaqueShine(tier, 40, 14, t, { index, count })) frames++;
    }
    return frames / 10;
  };

  it('stays still most of the time', () => {
    for (const tier of ['bronze', 'silver', 'gold', 'platinum', 'opal'] as const) {
      expect(shining(tier)).toBeGreaterThan(0);
      expect(shining(tier)).toBeLessThan(600 * 0.15);
    }
  });

  it('shines more as the metal grows finer', () => {
    expect(shining('silver')).toBeGreaterThan(shining('bronze'));
    expect(shining('gold')).toBeGreaterThan(shining('silver'));
    expect(shining('platinum')).toBeGreaterThan(shining('gold'));
  });

  it('gives each metal its own light: bronze warms a rivet, gold and platinum shine white', () => {
    const toneSet = (tier: Parameters<typeof plaqueShine>[0]) => {
      const tones = new Set<string>();
      for (let t = 0; t < 120; t += 0.1) {
        plaqueShine(tier, 40, 14, t)?.pixels.forEach(
          (pixel) => pixel?.tone && tones.add(pixel.tone),
        );
      }
      return tones;
    };
    expect([...toneSet('bronze')]).toEqual(['bronzeLight']);
    expect(toneSet('silver').has('metalShine')).toBe(false);
    expect(toneSet('gold').has('metalShine')).toBe(true);
    expect(toneSet('platinum').has('metalShine')).toBe(true);
    expect(toneSet('opal').has('opalB')).toBe(true);
  });

  it('lets the plaques of a wall take turns: never two at once, never many', () => {
    const count = 6;
    for (let t = 0; t < 600; t += 0.1) {
      const now = Array.from({ length: count }, (_, i) =>
        glintAt('platinum', t, { index: i, count }),
      );
      expect(now.filter((g) => g !== null).length).toBeLessThanOrEqual(1);
    }
    // A full wall shines no more than a wall with one plaque.
    const wall = Array.from({ length: count }, (_, i) => shining('gold', i, count)).reduce(
      (a, b) => a + b,
    );
    expect(wall).toBeLessThanOrEqual(shining('gold') * 2.1);
    // At most one glint every 8 seconds on a full wall.
    expect(wall).toBeLessThanOrEqual((600 / 8) * 1.2);
  });

  it('never shines on a tarnished plaque nor on a plain board', () => {
    for (let t = 0; t < 60; t += 0.3) {
      expect(plaqueShine('tarnished', 40, 14, t)).toBeNull();
      expect(plaqueShine('wood', 40, 14, t)).toBeNull();
    }
  });
});
