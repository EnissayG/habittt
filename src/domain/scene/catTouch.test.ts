import { CAT_BEAT, CAT_FRAME_COUNT, type CatPose } from './cat';
import { CAT_HEART, catReaction, HEART_LIFE, type CatTouch } from './catTouch';

const tap = (pose: CatPose): CatTouch => ({ kind: 'tap', pose, held: null });
const pet = (pose: CatPose, held: number | null = null): CatTouch => ({ kind: 'pet', pose, held });

/** The reaction, beat by beat, until it is over. */
function play(touch: CatTouch) {
  const steps = [];
  for (let t = 0; t < 60; t += CAT_BEAT / 2) {
    const reaction = catReaction(touch, t);
    steps.push(reaction);
    if (reaction.done) break;
  }
  return steps;
}

describe('catReaction', () => {
  const poses: CatPose[] = ['stand', 'walk', 'sit', 'lie', 'sleep'];

  it('answers a tap in every pose, with a heart, and is soon over', () => {
    for (const pose of poses) {
      const steps = play(tap(pose));
      expect(steps.at(-1)!.done).toBe(true);
      expect(steps.length * (CAT_BEAT / 2)).toBeLessThan(4);
      expect(steps.some((step) => step.hearts.length > 0)).toBe(true);
    }
  });

  it('only shows frames of the drawing', () => {
    for (const pose of poses) {
      for (const touch of [tap(pose), pet(pose, 3)]) {
        for (const step of play(touch)) {
          if (step.frame !== null) {
            expect(step.frame).toBeGreaterThanOrEqual(0);
            expect(step.frame).toBeLessThan(CAT_FRAME_COUNT);
          }
        }
      }
    }
  });

  it('goes back to how it was, so that its day goes on without a jump', () => {
    const last = (touch: CatTouch) => play(touch).at(-1)!.frame;
    expect(last(tap('stand'))).toBe(0);
    expect(last(tap('sit'))).toBe(7);
    expect(last(tap('lie'))).toBe(12);
    expect(last(tap('sleep'))).toBe(16);
    expect(last(pet('stand', 2))).toBe(0);
    expect(last(pet('sit', 2))).toBe(7);
    expect(last(pet('lie', 2))).toBe(12);
  });

  it('jumps on the spot when tapped standing; keeps hopping when tapped hopping', () => {
    expect(play(tap('stand')).map((step) => step.frame)).toContain(4);
    expect(play(tap('walk')).every((step) => step.frame === null)).toBe(true);
  });

  it('settles down and closes its eyes for as long as it is petted, hearts rising', () => {
    const at = (t: number) => catReaction(pet('stand'), t);
    expect(at(0).frame).toBe(6); // it sits down first
    for (let t = 2; t < 30; t += 0.5) {
      expect([17, 18, 19]).toContain(at(t).frame);
      expect(at(t).done).toBe(false);
      expect(at(t).hearts.length).toBeGreaterThan(0);
    }
  });

  it('lets its hearts rise and fade, then stops making them once the finger leaves', () => {
    const one = (t: number) => catReaction(tap('lie'), t).hearts[0]!;
    expect(one(0.6).y).toBeLessThan(one(0.1).y);
    expect(one(0.1).alpha).toBe(1);
    expect(one(HEART_LIFE - 0.1).alpha).toBeLessThan(0.5);
    const touch = pet('lie', 3);
    expect(catReaction(touch, 2.9).hearts.length).toBeGreaterThan(0);
    expect(catReaction(touch, 3 + HEART_LIFE + 0.1).hearts).toHaveLength(0);
  });

  it('draws its heart with known letters', () => {
    for (const row of CAT_HEART) {
      expect(row).toHaveLength(CAT_HEART[0]!.length);
      expect(row).toMatch(/^[ohl.]+$/);
    }
  });
});
