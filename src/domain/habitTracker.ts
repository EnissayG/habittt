import { createHabit, type CreateHabitError, type Habit, type HabitId } from './habit';
import type { LocalDate } from './localDate';
import { MAX_GROWTH_DAYS, type PlantImage } from './plant/grid';
import { FALLBACK_SPECIES_ID, SPECIES_IDS, type SpeciesId } from './plant/registry';
import { renderPlant } from './plant/renderPlant';
import type { Clock, IdGenerator, SeedGenerator } from './ports';
import { cancelRelapse, isActive, recordRelapse, type RecordRelapseError } from './relapse';
import type { HabitRepository, RelapseRepository } from './repositories';
import { err, ok, type Result } from './result';
import { drawRoom } from './scene/drawRoom';
import { drawWindow } from './scene/drawWindow';
import type { SceneImage } from './scene/sceneImage';
import { windowView, type WindowView } from './scene/windowView';
import { arrangeShelf, type ShelfLayout } from './shelf';
import { computeStats, type HabitStats } from './stats';
import { buildTimeline, type DayEntry } from './timeline';

export interface HabitSummary {
  habit: Habit;
  stats: HabitStats;
  plant: PlantImage;
}

export interface HabitDetail extends HabitSummary {
  days: DayEntry[];
}

export interface Shelf {
  layout: ShelfLayout;
  /** Every habit on the shelf, by id. */
  habits: Readonly<Record<HabitId, HabitSummary>>;
  totals: { plants: number; cleanDays: number };
  view: WindowView;
  window: SceneImage;
  /** The floor, reflecting the window and the bottom shelf. */
  room: SceneImage;
}

export interface AddHabitInput {
  name: string;
  startDate: LocalDate;
  /** Omitted for "Surprise": a species is drawn at random. */
  species?: SpeciesId;
}

export type ToggleRelapseError = RecordRelapseError | 'HABIT_NOT_FOUND';

export interface HabitTrackerDeps {
  habits: HabitRepository;
  relapses: RelapseRepository;
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
  const { habits, relapses, clock } = deps;

  async function detail(habit: Habit, today: LocalDate): Promise<HabitDetail> {
    const habitRelapses = await relapses.listByHabit(habit.id);
    const params = { startDate: habit.startDate, relapses: habitRelapses, today };
    const stats = computeStats(params);
    const days = buildTimeline(params);
    const plant = renderPlant({
      species: habit.species,
      seed: habit.seed,
      elapsedDays: stats.totalDays,
      // Plant day numbers start at 1 on startDate; timeline indexes at 0.
      relapseDays: days.filter((day) => day.relapsed).map((day) => day.index + 1),
    });
    return { habit, stats, days, plant };
  }

  async function oldestFirst(): Promise<Habit[]> {
    const all = await habits.list();
    return [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

    async getHabit(id: HabitId): Promise<HabitDetail | undefined> {
      const habit = await habits.getById(id);
      return habit && detail(habit, clock.today());
    },

    /** Everything the shelf screen shows. */
    async getShelf(): Promise<Shelf> {
      const today = clock.today();
      const summaries = await Promise.all((await oldestFirst()).map((h) => detail(h, today)));
      const byId: Record<HabitId, HabitSummary> = {};
      for (const { habit, stats, plant } of summaries) byId[habit.id] = { habit, stats, plant };

      const layout = arrangeShelf(summaries.map(({ habit }) => habit));
      const view = windowView(clock.hour(), today);
      const bottomShelf = layout.shelves[layout.shelves.length - 1] ?? [];
      const reflected = bottomShelf.map((slot) =>
        slot.kind === 'plant' ? (byId[slot.id]?.plant ?? null) : null,
      );

      return {
        layout,
        habits: byId,
        totals: {
          plants: summaries.length,
          cleanDays: summaries.reduce((sum, { stats }) => sum + stats.cleanDays, 0),
        },
        view,
        window: drawWindow(view),
        room: drawRoom({ view, reflected }),
      };
    },

    /** The plant of the opening screen: the oldest habit's, or a grown bonsai. */
    async openingPlant(): Promise<PlantImage> {
      const [oldest] = await oldestFirst();
      if (oldest) return (await detail(oldest, clock.today())).plant;
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

    /** Records a relapse on that day; does nothing if one is already active. */
    async recordRelapse(
      habitId: HabitId,
      date: LocalDate,
    ): Promise<Result<'recorded' | 'unchanged', ToggleRelapseError>> {
      const habit = await habits.getById(habitId);
      if (!habit) return err('HABIT_NOT_FOUND');
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
      const habit = await habits.getById(habitId);
      if (!habit) return err('HABIT_NOT_FOUND');

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
