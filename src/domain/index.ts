export {
  createHabit,
  HABIT_NAME_MAX_LENGTH,
  type CreateHabitDeps,
  type CreateHabitError,
  type CreateHabitInput,
  type Habit,
  type HabitId,
} from './habit';
export { normalizeHabitName } from './habitName';
export {
  createHabitTracker,
  type AddHabitInput,
  type HabitDetail,
  type HabitSummary,
  type HabitTracker,
  type HabitTrackerDeps,
  type ToggleRelapseError,
} from './habitTracker';
export {
  arrangeShelf,
  SLOTS_PER_SHELF,
  type ShelfItem,
  type ShelfLayout,
  type ShelfSlot,
} from './shelf';
export { buildTimeline, type DayEntry } from './timeline';
export { addDays, daysBetween, isLocalDate, parseLocalDate, type LocalDate } from './localDate';
export * from './plant';
export type { Clock, IdGenerator, SeedGenerator } from './ports';
export {
  cancelRelapse,
  isActive,
  recordRelapse,
  relapseIdFor,
  type CancelRelapseOutcome,
  type RecordRelapseError,
  type RecordRelapseOutcome,
  type RecordRelapseParams,
  type Relapse,
} from './relapse';
export type { HabitRepository, RelapseRepository } from './repositories';
export { err, ok, type Result } from './result';
export { computeStats, type ComputeStatsParams, type HabitStats } from './stats';
