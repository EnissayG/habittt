import { createHabit, type CreateHabitError, type Habit, type HabitId } from './habit';
import { addDays, type LocalDate } from './localDate';
import type { PlantImage } from './plant/grid';
import { FALLBACK_SPECIES_ID, SPECIES_IDS, type SpeciesId } from './plant/registry';
import { renderPlant } from './plant/renderPlant';
import type { Clock, IdGenerator, SeedGenerator } from './ports';
import { cancelRelapse, isActive, recordRelapse, type RecordRelapseError } from './relapse';
import type { HabitRepository, RelapseRepository } from './repositories';
import { err, ok, type Result } from './result';
import { computeStats, type HabitStats } from './stats';
import { buildTimeline, type DayEntry } from './timeline';

export interface HabitSummary {
  habit: Habit;
  stats: HabitStats;
}

export interface HabitDetail extends HabitSummary {
  days: DayEntry[];
  plant: PlantImage;
}

export interface AddHabitInput {
  name: string;
  /** 0 = starting today. */
  startedDaysAgo: number;
  /** Chosen by the user; drawn at random until the picker screen exists. */
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

/**
 * The app's use cases: each one loads what it needs through the repository
 * interfaces, applies the pure domain rules, and saves the result.
 */
export function createHabitTracker(deps: HabitTrackerDeps) {
  const { habits, relapses, clock } = deps;

  async function summarize(habit: Habit, today: LocalDate) {
    const habitRelapses = await relapses.listByHabit(habit.id);
    const params = { startDate: habit.startDate, relapses: habitRelapses, today };
    return { habit, stats: computeStats(params), days: buildTimeline(params) };
  }

  return {
    async listHabits(): Promise<HabitSummary[]> {
      const today = clock.today();
      const all = await habits.list();
      const sorted = [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const details = await Promise.all(sorted.map((habit) => summarize(habit, today)));
      return details.map(({ habit, stats }) => ({ habit, stats }));
    },

    async getHabit(id: HabitId): Promise<HabitDetail | undefined> {
      const habit = await habits.getById(id);
      if (!habit) return undefined;
      const summary = await summarize(habit, clock.today());
      const plant = renderPlant({
        species: habit.species,
        seed: habit.seed,
        elapsedDays: summary.stats.totalDays,
        // Plant day numbers start at 1 on startDate; timeline indexes at 0.
        relapseDays: summary.days.filter((day) => day.relapsed).map((day) => day.index + 1),
      });
      return { ...summary, plant };
    },

    async addHabit(input: AddHabitInput): Promise<Result<Habit, CreateHabitError>> {
      const startDate = addDays(clock.today(), -Math.max(0, Math.floor(input.startedDaysAgo)));
      const species =
        input.species ??
        SPECIES_IDS[deps.generateSeed() % SPECIES_IDS.length] ??
        FALLBACK_SPECIES_ID;
      const result = createHabit({ name: input.name, startDate, species }, deps);
      if (result.ok) await habits.save(result.value);
      return result;
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
