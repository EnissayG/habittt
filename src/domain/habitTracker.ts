import {
  createHabit,
  type CreateHabitError,
  type Habit,
  type HabitId,
  type HabitStatus,
} from './habit';
import type { LocalDate } from './localDate';
import { MAX_GROWTH_DAYS, type PlantImage } from './plant/grid';
import { FALLBACK_SPECIES_ID, SPECIES_IDS, type SpeciesId } from './plant/registry';
import { renderPlant } from './plant/renderPlant';
import type { Clock, IdGenerator, SeedGenerator } from './ports';
import {
  writeNote,
  type Mood,
  type Note,
  type WriteNoteError,
  type WriteNoteOutcome,
} from './note';
import { cancelRelapse, isActive, recordRelapse, type RecordRelapseError } from './relapse';
import type {
  HabitRepository,
  NoteRepository,
  RelapseRepository,
  WateringRepository,
} from './repositories';
import { err, ok, type Result } from './result';
import { eraseHabit, growthEnd, isOnShelf, retireHabit } from './retirement';
import { drawWindow } from './scene/drawWindow';
import type { SceneImage } from './scene/sceneImage';
import { windowView, type WindowView } from './scene/windowView';
import { arrangeShelf, type ShelfLayout } from './shelf';
import { computeStats, type HabitStats } from './stats';
import { buildTimeline, type DayEntry } from './timeline';
import { water, type WaterError } from './watering';

export interface HabitSummary {
  habit: Habit;
  stats: HabitStats;
  plant: PlantImage;
}

export interface HabitDetail extends HabitSummary {
  days: DayEntry[];
  /** Active notes, newest first. */
  notes: Note[];
  /** Today's note, to prefill the watering panel. */
  todayNote: Note | null;
  wateredToday: boolean;
}

export interface NoteInput {
  text: string;
  mood: Mood | null;
}

/** HABIT_RETIRED: the plant left the shelf, nothing more is written about it. */
export type HabitAccessError = 'HABIT_NOT_FOUND' | 'HABIT_RETIRED';
export type SaveNoteError = WriteNoteError | HabitAccessError;
export type WaterTodayError = SaveNoteError | WaterError;

export interface Shelf {
  layout: ShelfLayout;
  /** Every habit on the shelf, by id. */
  habits: Readonly<Record<HabitId, HabitSummary>>;
  /** currentDays: the sum of the current streaks, the numbers shown under the plants. */
  totals: { plants: number; currentDays: number };
  view: WindowView;
  window: SceneImage;
}

export interface AddHabitInput {
  name: string;
  startDate: LocalDate;
  /** Omitted for "Surprise": a species is drawn at random. */
  species?: SpeciesId;
}

export type ToggleRelapseError = RecordRelapseError | HabitAccessError;

export interface HabitTrackerDeps {
  habits: HabitRepository;
  relapses: RelapseRepository;
  notes: NoteRepository;
  waterings: WateringRepository;
  clock: Clock;
  generateId: IdGenerator;
  generateSeed: SeedGenerator;
}

/** Shown on the opening screen when there is no habit yet: a grown bonsai. */
const OPENING_DEFAULT = { species: 'bonsai', seed: 12 } as const;

/**
 * The app's use cases: each one loads what it needs through the repository
 * interfaces, applies the pure domain rules, and saves the result.
 */
export function createHabitTracker(deps: HabitTrackerDeps) {
  const { habits, relapses, notes, waterings, clock } = deps;

  /** A habit that can still be written about: on the shelf, not erased. */
  async function writable(id: HabitId): Promise<Result<Habit, HabitAccessError>> {
    const habit = await habits.getById(id);
    if (!habit || habit.deletedAt !== null) return err('HABIT_NOT_FOUND');
    if (habit.status !== 'shelf') return err('HABIT_RETIRED');
    return ok(habit);
  }

  async function detail(habit: Habit, now: LocalDate): Promise<HabitDetail> {
    // A retired plant stops growing on the day it left the shelf.
    const today = growthEnd(habit, now);
    const live = isOnShelf(habit);
    const [habitRelapses, habitNotes, habitWaterings] = await Promise.all([
      relapses.listByHabit(habit.id),
      notes.listByHabit(habit.id),
      waterings.listByHabit(habit.id),
    ]);
    const params = { startDate: habit.startDate, relapses: habitRelapses, today };
    const stats = computeStats(params);
    const days = buildTimeline({ ...params, notes: habitNotes, waterings: habitWaterings });
    const plant = renderPlant({
      species: habit.species,
      seed: habit.seed,
      elapsedDays: stats.totalDays,
      // Plant day numbers start at 1 on startDate; timeline indexes at 0.
      relapseDays: days.filter((day) => day.relapsed).map((day) => day.index + 1),
      wateredDays: days.filter((day) => day.watered).map((day) => day.index + 1),
    });
    const todayEntry = days[days.length - 1];
    return {
      habit,
      stats,
      days,
      plant,
      notes: days.flatMap((day) => (day.note ? [day.note] : [])).reverse(),
      todayNote: live ? (todayEntry?.note ?? null) : null,
      wateredToday: live && (todayEntry?.watered ?? false),
    };
  }

  /** The habits of the shelf, oldest first. */
  async function oldestFirst(): Promise<Habit[]> {
    const all = (await habits.list()).filter(isOnShelf);
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return {
    /** Today in the user's time zone (bounds for date pickers). */
    today(): LocalDate {
      return clock.today();
    },

    async listHabits(): Promise<HabitSummary[]> {
      const today = clock.today();
      const details = await Promise.all((await oldestFirst()).map((h) => detail(h, today)));
      return details.map(({ habit, stats, plant }) => ({ habit, stats, plant }));
    },

    /** A habit of the shelf or the garden (a given one too); never an erased one. */
    async getHabit(id: HabitId): Promise<HabitDetail | undefined> {
      const habit = await habits.getById(id);
      return habit && habit.deletedAt === null ? detail(habit, clock.today()) : undefined;
    },

    /** Takes a plant off the shelf, to the garden or given away. */
    async retireHabit(
      id: HabitId,
      to: Exclude<HabitStatus, 'shelf'>,
    ): Promise<Result<void, HabitAccessError>> {
      const found = await writable(id);
      if (!found.ok) return found;
      const retired = retireHabit(found.value, to, clock);
      if (!retired.ok) return err('HABIT_RETIRED');
      await habits.save(retired.value);
      return ok(undefined);
    },

    /** Erases a habit for good, from the shelf or the garden: only a trace remains. */
    async eraseHabit(id: HabitId): Promise<Result<void, 'HABIT_NOT_FOUND'>> {
      const habit = await habits.getById(id);
      if (!habit || habit.deletedAt !== null) return err('HABIT_NOT_FOUND');
      await habits.erase(eraseHabit(habit, clock));
      return ok(undefined);
    },

    /** Everything the shelf screen shows. */
    async getShelf(): Promise<Shelf> {
      const today = clock.today();
      const summaries = await Promise.all((await oldestFirst()).map((h) => detail(h, today)));
      const byId: Record<HabitId, HabitSummary> = {};
      for (const { habit, stats, plant } of summaries) byId[habit.id] = { habit, stats, plant };

      const layout = arrangeShelf(summaries.map(({ habit }) => habit));
      const view = windowView(clock.hour(), today);
      return {
        layout,
        habits: byId,
        totals: {
          plants: summaries.length,
          currentDays: summaries.reduce((sum, { stats }) => sum + stats.currentStreak, 0),
        },
        view,
        window: drawWindow(view),
      };
    },

    /** The plant of the opening screen: always the same grown bonsai, the app's emblem. */
    async openingPlant(): Promise<PlantImage> {
      return renderPlant({ ...OPENING_DEFAULT, elapsedDays: MAX_GROWTH_DAYS, relapseDays: [] });
    },

    async addHabit(input: AddHabitInput): Promise<Result<Habit, CreateHabitError>> {
      const species =
        input.species ??
        SPECIES_IDS[deps.generateSeed() % SPECIES_IDS.length] ??
        FALLBACK_SPECIES_ID;
      const result = createHabit({ name: input.name, startDate: input.startDate, species }, deps);
      if (result.ok) await habits.save(result.value);
      return result;
    },

    /** Writes, updates or deletes (when emptied) the note of a day. */
    async saveNote(
      habitId: HabitId,
      date: LocalDate,
      input: NoteInput,
    ): Promise<Result<WriteNoteOutcome['change'], SaveNoteError>> {
      const found = await writable(habitId);
      if (!found.ok) return found;
      const habit = found.value;
      const existing = await notes.findByHabitAndDate(habitId, date);
      const result = writeNote({ habit, date, ...input, existing, clock });
      if (!result.ok) return result;
      if (result.value.change !== 'unchanged' && result.value.note) {
        await notes.save(result.value.note);
      }
      return ok(result.value.change);
    },

    /**
     * Waters the plant today, and writes today's note when one is given.
     * Checked before anything is saved: a refused note waters nothing.
     */
    async waterToday(
      habitId: HabitId,
      note?: NoteInput,
    ): Promise<
      Result<
        { watering: 'created' | 'unchanged'; note: WriteNoteOutcome['change'] | null },
        WaterTodayError
      >
    > {
      const found = await writable(habitId);
      if (!found.ok) return found;
      const habit = found.value;
      const today = clock.today();
      const watered = water({
        habit,
        date: today,
        existing: await waterings.findByHabitAndDate(habitId, today),
        clock,
      });
      if (!watered.ok) return watered;
      const written = note
        ? writeNote({
            habit,
            date: today,
            ...note,
            existing: await notes.findByHabitAndDate(habitId, today),
            clock,
          })
        : null;
      if (written && !written.ok) return written;

      if (watered.value.change === 'created') await waterings.save(watered.value.watering);
      if (written && written.value.change !== 'unchanged' && written.value.note) {
        await notes.save(written.value.note);
      }
      return ok({ watering: watered.value.change, note: written ? written.value.change : null });
    },

    /** Records a relapse on that day; does nothing if one is already active. */
    async recordRelapse(
      habitId: HabitId,
      date: LocalDate,
    ): Promise<Result<'recorded' | 'unchanged', ToggleRelapseError>> {
      const found = await writable(habitId);
      if (!found.ok) return found;
      const habit = found.value;
      const existing = await relapses.findByHabitAndDate(habitId, date);
      const result = recordRelapse({ habit, date, existing, clock });
      if (!result.ok) return result;
      if (result.value.change === 'unchanged') return ok('unchanged');
      await relapses.save(result.value.relapse);
      return ok('recorded');
    },

    /** Records a relapse on that day, or cancels it if one is already active. */
    async toggleRelapse(
      habitId: HabitId,
      date: LocalDate,
    ): Promise<Result<'recorded' | 'cancelled', ToggleRelapseError>> {
      const found = await writable(habitId);
      if (!found.ok) return found;
      const habit = found.value;

      const existing = await relapses.findByHabitAndDate(habitId, date);
      if (existing && isActive(existing)) {
        await relapses.save(cancelRelapse(existing, clock).relapse);
        return ok('cancelled');
      }

      const result = recordRelapse({ habit, date, existing, clock });
      if (!result.ok) return result;
      if (result.value.change !== 'unchanged') await relapses.save(result.value.relapse);
      return ok('recorded');
    },
  };
}

export type HabitTracker = ReturnType<typeof createHabitTracker>;
