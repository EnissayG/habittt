import {
  CAT_BREEDS,
  CAT_FEET,
  CAT_FRAME_COUNT,
  CAT_FRAMES,
  CAT_HOP,
  CAT_SIZE,
  CAT_SPEED,
  catAt,
  drawCat,
  type CatPose,
} from './cat';
import { CAT_SPRITES } from './catSprites';

describe('the drawing', () => {
  it('has twenty frames of the same size, made of known letters only', () => {
    expect(CAT_SPRITES).toHaveLength(20);
    for (const frame of CAT_SPRITES) {
      expect(frame).toHaveLength(CAT_SIZE.height);
      for (const row of frame) {
        expect(row).toHaveLength(CAT_SIZE.width);
        expect(row).toMatch(/^[abcdefE.]+$/);
      }
    }
  });

  it('stands on the floor: the paws on the row above CAT_FEET, but in the air', () => {
    const lowest = (frame: number) =>
      Math.max(
        ...CAT_SPRITES[frame]!.slice(0, CAT_FEET + 1).flatMap((row, y) =>
          /[^.]/.test(row) ? [y] : [],
        ),
      );
    for (let frame = 0; frame < CAT_FRAME_COUNT; frame++) {
      // Frame 3 pushes off: the back paws still on the floor.
      const inTheAir = frame === 4 || frame === 5;
      if (inTheAir) expect(lowest(frame)).toBeLessThan(CAT_FEET);
      else expect(lowest(frame)).toBe(CAT_FEET);
    }
  });
});

describe('drawCat', () => {
  it('draws every coat in every frame, outlined', () => {
    for (const breed of CAT_BREEDS) {
      for (let frame = 0; frame < CAT_FRAME_COUNT; frame++) {
        const cat = drawCat(breed, frame);
        expect([cat.width, cat.height]).toEqual([CAT_SIZE.width, CAT_SIZE.height]);
        expect(cat.pixels).toContain('outline');
        expect(cat.pixels).toContain('nose');
      }
    }
  });

  it('keeps the tabby exactly as drawn', () => {
    const letters: Record<string, string> = {
      a: 'outline',
      b: 'fur',
      c: 'furLight',
      d: 'stripe',
      e: 'furShade',
      f: 'nose',
      E: 'eye',
    };
    const cat = drawCat('tabby', 7);
    CAT_SPRITES[7]!.forEach((row, y) =>
      [...row].forEach((letter, x) =>
        expect(cat.pixels[y * cat.width + x]).toBe(letters[letter] ?? null),
      ),
    );
  });

  it('mirrors itself to face left', () => {
    const right = drawCat('calico', 2, 'right');
    const left = drawCat('calico', 2, 'left');
    for (let y = 0; y < right.height; y++) {
      for (let x = 0; x < right.width; x++) {
        expect(left.pixels[y * right.width + (right.width - 1 - x)]).toBe(
          right.pixels[y * right.width + x],
        );
      }
    }
  });

  it('opens its eyes but when asleep', () => {
    const eyes = (frame: number) =>
      drawCat('black', frame).pixels.filter((t) => t === 'eye').length;
    for (const frame of [0, 4, 7, 12, CAT_FRAMES.doze]) expect(eyes(frame)).toBe(4);
    for (const frame of CAT_FRAMES.sleep) expect(eyes(frame)).toBe(0);
  });

  it('gives each breed its coat', () => {
    const tones = (breed: (typeof CAT_BREEDS)[number]) => new Set(drawCat(breed, 0).pixels);
    expect(tones('tabby').has('stripe')).toBe(true);
    expect(tones('calico').has('patchA')).toBe(true);
    expect(tones('calico').has('patchB')).toBe(true);
    expect(tones('calico').has('stripe')).toBe(false);
    expect(tones('siamese').has('point')).toBe(true);
    expect(tones('grey').has('patchA')).toBe(false);
  });
});

describe('catAt', () => {
  const span = { from: 4, to: 480 };

  it('starts asleep, and is always the same cat for the same seed', () => {
    expect(catAt(0, 7, span).pose).toBe('sleep');
    for (const t of [0, 30, 95.5, 400, 1800]) expect(catAt(t, 7, span)).toEqual(catAt(t, 7, span));
    expect(catAt(0, 7, span).x).not.toBe(catAt(0, 1234, span).x);
  });

  it('stays along the floor of the room', () => {
    for (let t = 0; t < 1800; t += 1.7) {
      const { x } = catAt(t, 3, span);
      expect(x).toBeGreaterThanOrEqual(span.from);
      expect(x + CAT_SIZE.width).toBeLessThanOrEqual(span.to);
    }
  });

  it('moves at a cat pace, and only while hopping', () => {
    let before = catAt(0, 3, span);
    for (let t = 0.25; t < 1800; t += 0.25) {
      const now = catAt(t, 3, span);
      const moved = Math.abs(now.x - before.x);
      expect(moved).toBeLessThanOrEqual(CAT_HOP);
      if (moved > 0) expect([now.pose, before.pose]).toContain('walk');
      before = now;
    }
    expect(CAT_SPEED).toBeGreaterThan(5);
    expect(CAT_SPEED).toBeLessThan(10);
  });

  it('hops: it moves only off the floor, its paws never slide', () => {
    const onFloor = (frame: number) => frame === 0 || frame === 2 || frame === 3;
    let before = catAt(0, 5, span);
    let hopped = 0;
    for (let t = 0.03; t < 1200; t += 0.03) {
      const now = catAt(t, 5, span);
      if (now.pose === 'walk' && before.pose === 'walk') {
        if (onFloor(now.frame) && onFloor(before.frame)) expect(now.x).toBe(before.x);
        hopped += Math.abs(now.x - before.x);
      }
      before = now;
    }
    expect(hopped).toBeGreaterThan(100);
  });

  it('lives a little day: sleeps, lies, sits, stands, hops, and goes from wall to wall', () => {
    const seen = new Set<CatPose>();
    const frames = new Set<number>();
    const walls = new Set<number>();
    for (let t = 0; t < 3600; t += 0.05) {
      const state = catAt(t, 11, span);
      seen.add(state.pose);
      frames.add(state.frame);
      walls.add(Math.floor((state.x + CAT_SIZE.width / 2) / 160));
    }
    expect([...seen].sort()).toEqual(['lie', 'sit', 'sleep', 'stand', 'walk']);
    expect(frames.size).toBe(CAT_FRAME_COUNT);
    expect(walls.size).toBeGreaterThanOrEqual(2);
  });

  it('gets into each pose the way the drawing does it', () => {
    // Watch every change of pose: sitting starts by sitting down (or rising
    // from lying), lying by lying down (or waking up), sleep by dozing off.
    let before = catAt(0, 9, span);
    for (let t = 0.02; t < 2400; t += 0.02) {
      const now = catAt(t, 9, span);
      if (now.pose !== before.pose) {
        if (now.pose === 'sit') {
          expect([CAT_FRAMES.sitDown, CAT_FRAMES.lieDown]).toContain(now.frame);
        }
        if (now.pose === 'lie') expect([CAT_FRAMES.lieDown, CAT_FRAMES.doze]).toContain(now.frame);
        if (now.pose === 'sleep') expect(now.frame).toBe(CAT_FRAMES.doze);
      }
      before = now;
    }
  });
});
