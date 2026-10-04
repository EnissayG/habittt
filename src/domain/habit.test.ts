import { createHabit, HABIT_NAME_MAX_LENGTH, type CreateHabitDeps } from './habit';
import { NOW, TODAY, day, fixedClock } from './testSupport';

const HABIT_ID = '22222222-2222-4222-8222-222222222222';

function deps(overrides: Partial<CreateHabitDeps> = {}): CreateHabitDeps {
  return {
    generateId: jest.fn(() => HABIT_ID),
    generateSeed: jest.fn(() => 123456789),
    clock: fixedClock(),
    ...overrides,
  };
}

describe('createHabit', () => {
  it('builds a habit from the input and the injected generators and clock', () => {
    const result = createHabit({ species: 'pothos', name: 'No smoking', startDate: TODAY }, deps());

    expect(result).toEqual({
      ok: true,
      value: {
        id: HABIT_ID,
        name: 'No smoking',
        seed: 123456789,
        species: 'pothos',
        startDate: TODAY,
        createdAt: NOW,
      },
    });
  });

  it('throws on an unknown species (programming error: only known ones are offered)', () => {
    const input = { species: 'orchid' as 'pothos', name: 'No smoking', startDate: TODAY };
    expect(() => createHabit(input, deps())).toThrow(/orchid/);
  });

  it('normalizes the name', () => {
    const result = createHabit(
      { species: 'pothos', name: '  No   sugar ', startDate: TODAY },
      deps(),
    );
    expect(result.ok && result.value.name).toBe('No sugar');
  });

  describe('start date', () => {
    it('accepts a start date weeks in the past', () => {
      const result = createHabit(
        { species: 'pothos', name: 'No smoking', startDate: day(-60) },
        deps(),
      );
      expect(result.ok && result.value.startDate).toBe(day(-60));
    });

    it('refuses a start date in the future', () => {
      const result = createHabit(
        { species: 'pothos', name: 'No smoking', startDate: day(1) },
        deps(),
      );
      expect(result).toEqual({ ok: false, error: 'START_DATE_IN_FUTURE' });
    });
  });

  describe('name', () => {
    it.each(['', '   ', '\n\t'])('refuses a blank name %p', (name) => {
      const result = createHabit({ species: 'pothos', name, startDate: TODAY }, deps());
      expect(result).toEqual({ ok: false, error: 'NAME_EMPTY' });
    });

    it(`accepts exactly ${HABIT_NAME_MAX_LENGTH} characters`, () => {
      const name = 'a'.repeat(HABIT_NAME_MAX_LENGTH);
      expect(createHabit({ species: 'pothos', name, startDate: TODAY }, deps()).ok).toBe(true);
    });

    it(`refuses ${HABIT_NAME_MAX_LENGTH + 1} characters`, () => {
      const name = 'a'.repeat(HABIT_NAME_MAX_LENGTH + 1);
      const result = createHabit({ species: 'pothos', name, startDate: TODAY }, deps());
      expect(result).toEqual({ ok: false, error: 'NAME_TOO_LONG' });
    });

    it('measures the length after normalization', () => {
      const name = `   ${'a'.repeat(HABIT_NAME_MAX_LENGTH)}   `;
      expect(createHabit({ species: 'pothos', name, startDate: TODAY }, deps()).ok).toBe(true);
    });

    it('counts an emoji as one character', () => {
      // '🌱' is 2 UTF-16 code units: 'x'.length would count 100 here.
      const name = '🌱'.repeat(HABIT_NAME_MAX_LENGTH);
      expect(createHabit({ species: 'pothos', name, startDate: TODAY }, deps()).ok).toBe(true);
    });

    it('reports the name error first when name and date are both invalid', () => {
      const result = createHabit({ species: 'pothos', name: '', startDate: day(1) }, deps());
      expect(result).toEqual({ ok: false, error: 'NAME_EMPTY' });
    });
  });

  it('does not consume an id or a seed when the habit is refused', () => {
    const d = deps();
    createHabit({ species: 'pothos', name: '', startDate: TODAY }, d);
    expect(d.generateId).not.toHaveBeenCalled();
    expect(d.generateSeed).not.toHaveBeenCalled();
  });

  it.each([-1, 1.5, 2 ** 32, Number.NaN])(
    'throws if the seed generator returns %p (programming error)',
    (seed) => {
      const d = deps({ generateSeed: () => seed });
      expect(() =>
        createHabit({ species: 'pothos', name: 'No smoking', startDate: TODAY }, d),
      ).toThrow(/seed/i);
    },
  );
});
