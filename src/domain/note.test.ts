import { writeNote, noteIdFor, NOTE_MAX_LENGTH, MOODS, isActiveNote, type Note } from './note';
import { day, fixedClock, LATER, makeHabit, NOW, TODAY } from './testSupport';

const habit = makeHabit({ startDate: day(-9) });
const clock = fixedClock();
const later = fixedClock(LATER);

function write(text: string, mood: Note['mood'] = null, existing?: Note, date = TODAY, c = clock) {
  return writeNote({ habit, date, text, mood, existing, clock: c });
}

describe('writeNote', () => {
  it('creates a note with a deterministic id', () => {
    const result = write('  Envie forte après le café.  ', 'craving');
    expect(result).toEqual({
      ok: true,
      value: {
        change: 'created',
        note: {
          id: noteIdFor(habit.id, TODAY),
          habitId: habit.id,
          date: TODAY,
          text: 'Envie forte après le café.',
          mood: 'craving',
          deletedAt: null,
          updatedAt: NOW,
        },
      },
    });
    expect(noteIdFor(habit.id, TODAY)).toBe(noteIdFor(habit.id, TODAY));
    expect(noteIdFor(habit.id, TODAY)).not.toBe(noteIdFor(habit.id, day(-1)));
  });

  it('accepts a mood alone, or a text alone', () => {
    expect(write('', 'proud').ok).toBe(true);
    const textOnly = write('Rien de spécial.');
    expect(textOnly.ok && textOnly.value.note?.mood).toBeNull();
  });

  it('keeps line breaks but normalizes them', () => {
    const result = write('Matin.\r\nSoir.');
    expect(result.ok && result.value.note?.text).toBe('Matin.\nSoir.');
  });

  it('updates the note of the day, and does nothing when nothing changes', () => {
    const created = write('Un', 'easy');
    if (!created.ok || !created.value.note) throw new Error('setup');
    const updated = write('Deux', 'stress', created.value.note, TODAY, later);
    expect(updated.ok && updated.value.change).toBe('updated');
    expect(updated.ok && updated.value.note).toMatchObject({
      text: 'Deux',
      mood: 'stress',
      updatedAt: LATER,
    });
    const same = write(' Un ', 'easy', created.value.note, TODAY, later);
    expect(same.ok && same.value).toEqual({ change: 'unchanged', note: created.value.note });
  });

  it('deletes a note emptied of text and mood (soft delete), and brings it back when rewritten', () => {
    const created = write('Un');
    if (!created.ok || !created.value.note) throw new Error('setup');
    const deleted = write('   ', null, created.value.note, TODAY, later);
    expect(deleted.ok && deleted.value.change).toBe('deleted');
    expect(deleted.ok && deleted.value.note).toMatchObject({ deletedAt: LATER, updatedAt: LATER });
    expect(deleted.ok && deleted.value.note && isActiveNote(deleted.value.note)).toBe(false);

    if (!deleted.ok || !deleted.value.note) throw new Error('setup');
    const back = write('Trois', null, deleted.value.note, TODAY, later);
    expect(back.ok && back.value.change).toBe('updated');
    expect(back.ok && back.value.note).toMatchObject({ text: 'Trois', deletedAt: null });
  });

  it('writes nothing for an empty note when there was none', () => {
    expect(write('  ', null)).toEqual({
      ok: true,
      value: { change: 'unchanged', note: undefined },
    });
  });

  it('refuses a note in the future, before the start, or too long', () => {
    expect(write('x', null, undefined, day(1))).toEqual({ ok: false, error: 'NOTE_IN_FUTURE' });
    expect(write('x', null, undefined, day(-10))).toEqual({
      ok: false,
      error: 'NOTE_BEFORE_START',
    });
    expect(write('x'.repeat(NOTE_MAX_LENGTH + 1))).toEqual({ ok: false, error: 'NOTE_TOO_LONG' });
    expect(write('x'.repeat(NOTE_MAX_LENGTH)).ok).toBe(true);
  });

  it('offers the four moods of the mockup, in order', () => {
    expect(MOODS).toEqual(['proud', 'craving', 'stress', 'easy']);
  });
});
