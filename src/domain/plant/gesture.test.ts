import { GESTURE_SECONDS, gestureAt, gestureParts, livingPlant, withGesture } from './gesture';
import type { PlantImage } from './grid';
import { SPECIES_IDS, SPECIES_REGISTRY } from './registry';
import { planPlant, renderPlant } from './renderPlant';

const SEEDS = [1, 7, 42, 174];
const FPS = 6;

const grown = (species: string, seed: number, elapsedDays = 120) =>
  renderPlant({ species, seed, elapsedDays, relapseDays: [], wateredDays: [3, 40] });

const changed = (a: PlantImage, b: PlantImage) =>
  a.pixels.reduce<number[]>((list, pixel, i) => {
    const other = b.pixels[i];
    if (pixel?.tone !== other?.tone || pixel?.day !== other?.day) list.push(i);
    return list;
  }, []);

const cases = SPECIES_IDS.flatMap((id) => SEEDS.map((seed) => [id, seed] as const));

describe('the parts of a plant that can make a gesture', () => {
  it.each(SPECIES_IDS)('%s: a grown plant has at least one, whatever its seed', (species) => {
    for (let seed = 0; seed < 40; seed++) {
      expect(gestureParts(grown(species, seed)).length).toBeGreaterThan(0);
    }
  });

  it.each(cases)('%s %i: every part is one the species declared', (species, seed) => {
    const { parts } = planPlant(species, seed);
    for (const part of gestureParts(grown(species, seed))) expect(parts[part]).toBeDefined();
  });

  it('has none for an empty pot, a dead plant, or an image made by hand', () => {
    expect(gestureParts(grown('monstera', 42, 0))).toEqual([]);
    const dead = renderPlant({
      species: 'monstera',
      seed: 42,
      elapsedDays: 120,
      relapseDays: [],
      dead: true,
    });
    expect(gestureParts(dead)).toEqual([]);
    expect(gestureParts({ ...grown('monstera', 42) })).toEqual([]);
  });

  it('grows with the plant: a young plant has fewer than a grown one', () => {
    for (const species of ['monstera', 'fern', 'ficus', 'aloe'] as const) {
      expect(gestureParts(grown(species, 42, 30)).length).toBeLessThan(
        gestureParts(grown(species, 42, 120)).length,
      );
    }
  });
});

describe('a gesture', () => {
  it.each(cases)('%s %i: moves a small part, and nothing else', (species, seed) => {
    const image = grown(species, seed);
    for (const part of gestureParts(image)) {
      const moved = withGesture(image, part);
      expect(moved).not.toBe(image);
      expect(moved.genome).toEqual(image.genome);
      expect(moved.dead).toBe(false);
      // A big monstera leaf is the largest part there is.
      expect(changed(image, moved).length).toBeLessThanOrEqual(120);
    }
  });

  it.each(cases)('%s %i: never draws over the pot or the soil', (species, seed) => {
    // A hanging vine may pass in front of the shelf, as it does at rest.
    const image = grown(species, seed);
    for (const part of gestureParts(image)) {
      const moved = withGesture(image, part);
      image.pixels.forEach((pixel, i) => {
        if (pixel?.day === 0 && !pixel.tone.startsWith('shelf')) {
          expect(moved.pixels[i]).toEqual(pixel);
        }
      });
    }
  });

  it.each(cases)('%s %i: moves by one cell at most', (species, seed) => {
    const image = grown(species, seed);
    const { parts } = planPlant(species, seed);
    for (const part of gestureParts(image)) {
      const { dx, dy } = parts[part]!;
      expect(Math.abs(dx)).toBeLessThanOrEqual(1);
      expect(Math.abs(dy)).toBeLessThanOrEqual(1);
      // What appears is next to something that was there.
      const moved = withGesture(image, part);
      for (const i of changed(image, moved)) {
        if (!moved.pixels[i]) continue;
        const x = i % image.width;
        const y = Math.floor(i / image.width);
        const near = [-1, 0, 1].some((oy) =>
          [-1, 0, 1].some((ox) => image.pixels[(y + oy) * image.width + x + ox]),
        );
        expect(near).toBe(true);
      }
    }
  });

  it.each(['bonsai', 'jade', 'ficus'] as const)('%s: never moves the wood', (species) => {
    for (const seed of SEEDS) {
      const image = grown(species, seed);
      const wood = (im: PlantImage) =>
        im.pixels.map((pixel) => (pixel?.tone === 'bark' || pixel?.tone === 'barkDark' ? 1 : 0));
      for (const part of gestureParts(image)) {
        const moved = withGesture(image, part);
        const before = wood(image);
        // Wood may show where a leaf moved away, never disappear or shift.
        wood(moved).forEach((now, i) => {
          if (before[i]) expect(now === 1 || moved.pixels[i]?.tone !== undefined).toBe(true);
        });
        expect(wood(moved).reduce<number>((n, v) => n + v, 0)).toBeGreaterThanOrEqual(
          before.reduce<number>((n, v) => n + v, 0) - 6,
        );
      }
    }
  });

  it('only closes a flower on a cactus: nothing moves, one petal is not drawn', () => {
    for (const seed of SEEDS) {
      const image = grown('cactus', seed);
      for (const part of gestureParts(image)) {
        const moved = withGesture(image, part);
        const cells = changed(image, moved);
        expect(cells.length).toBeLessThanOrEqual(3);
        for (const i of cells) expect(image.pixels[i]?.tone).toBe('flower');
      }
    }
  });

  it('follows the plant when it is mirrored', () => {
    // Same species, two seeds whose plants face opposite ways: parts move opposite ways.
    const offsets = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const { parts, genome } = planPlant('calathea', seed);
      // The first leaf grows on the species' left: outwards is -1, or +1 mirrored.
      expect(parts[0]!.dx).toBe(genome.mirrored ? 1 : -1);
      offsets.add(parts[0]!.dx);
    }
    expect(offsets.size).toBe(2);
  });

  it('is kept in memory: the same part gives the same image again', () => {
    const image = grown('fern', 42);
    const [part] = gestureParts(image);
    expect(withGesture(image, part!)).toBe(withGesture(image, part!));
    expect(withGesture(image, null)).toBe(image);
  });

  it('never moves a dead plant, nor an image made by hand', () => {
    const dead = renderPlant({
      species: 'fern',
      seed: 42,
      elapsedDays: 120,
      relapseDays: [],
      dead: true,
    });
    expect(withGesture(dead, 0)).toBe(dead);
    expect(
      renderPlant({
        species: 'fern',
        seed: 42,
        elapsedDays: 120,
        relapseDays: [],
        dead: true,
        gesture: 0,
      }),
    ).toEqual(dead);
    const copy = { ...grown('fern', 42) };
    expect(withGesture(copy, 0)).toBe(copy);
  });

  it('changes nothing in the drawing of a plant that keeps still', () => {
    for (const species of SPECIES_IDS) {
      const params = { species, seed: 42, elapsedDays: 90, relapseDays: [4], wateredDays: [9] };
      expect(renderPlant({ ...params, gesture: null })).toEqual(renderPlant(params));
    }
  });
});

describe('when a plant moves', () => {
  /** The part moving on each frame of the first `seconds`. */
  const timeline = (image: PlantImage, seconds: number) =>
    Array.from({ length: seconds * FPS }, (_, f) => gestureAt(image, (f + 1) / FPS));

  it('keeps still before time starts, and without time', () => {
    const image = grown('pothos', 42);
    expect(gestureAt(image, 0)).toBeNull();
    expect(gestureAt(image, -3)).toBeNull();
    expect(gestureAt(image, NaN)).toBeNull();
    expect(livingPlant(image, 0)).toBe(image);
  });

  it.each(SPECIES_IDS)('%s: keeps still most of the time, one gesture per rest', (species) => {
    const image = grown(species, 42);
    const { rest } = planPlant(species, 42);
    const frames = timeline(image, rest * 10);
    const moving = frames.filter((part) => part !== null).length;
    expect(moving).toBe(10 * GESTURE_SECONDS * FPS);
    // One part at a time, for the whole gesture.
    let runs = 0;
    frames.forEach((part, i) => {
      if (part === null) return;
      if (frames[i - 1] !== part) runs++;
      expect(gestureParts(image)).toContain(part);
    });
    expect(runs).toBeLessThanOrEqual(11);
    expect(runs).toBeGreaterThanOrEqual(10);
  });

  it('moves less often where it is asked to keep calm (the shelf)', () => {
    const image = grown('fern', 42);
    const { rest } = planPlant('fern', 42);
    const count = (calm: number) =>
      Array.from({ length: rest * 30 * FPS }, (_, f) =>
        gestureAt(image, (f + 1) / FPS, calm),
      ).filter((part) => part !== null).length;
    expect(count(1)).toBe(30 * GESTURE_SECONDS * FPS);
    expect(count(3)).toBe(10 * GESTURE_SECONDS * FPS);
    // Never faster than the species' own pace.
    expect(count(0.2)).toBe(count(1));
  });

  it('moves a stiff plant less often than a supple one', () => {
    const rest = (id: (typeof SPECIES_IDS)[number]) => SPECIES_REGISTRY[id].rest;
    for (const supple of ['fern', 'pothos', 'pearls', 'spider'] as const) {
      for (const stiff of ['cactus', 'sansevieria', 'aloe'] as const) {
        expect(rest(stiff)).toBeGreaterThanOrEqual(2 * rest(supple));
      }
    }
    for (const id of SPECIES_IDS) expect(rest(id)).toBeGreaterThanOrEqual(4);
  });

  it('does not always move the same part', () => {
    const image = grown('monstera', 42);
    const seen = new Set(timeline(image, 120).filter((part) => part !== null));
    expect(seen.size).toBeGreaterThan(3);
  });

  it('gives two plants of the same species their own moments', () => {
    const a = timeline(grown('fern', 1), 40).map((part) => part !== null);
    const b = timeline(grown('fern', 2), 40).map((part) => part !== null);
    expect(a).not.toEqual(b);
  });

  it('is the same on every phone: nothing but the seed and the time decide', () => {
    expect(timeline(grown('ficus', 42), 60)).toEqual(timeline(grown('ficus', 42), 60));
  });

  it('shows the plant itself between two gestures, and the moved one during', () => {
    const image = grown('pearls', 42);
    const frames = timeline(image, 30);
    const quiet = frames.indexOf(null);
    const busy = frames.findIndex((part) => part !== null);
    expect(livingPlant(image, (quiet + 1) / FPS)).toBe(image);
    expect(livingPlant(image, (busy + 1) / FPS)).toBe(withGesture(image, frames[busy]!));
  });
});
