export {
  checkHabitName,
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
  type Shelf,
  type ToggleRelapseError,
} from './habitTracker';
export {
  arrangeShelf,
  SHELVES_PER_WALL,
  SLOTS_PER_SHELF,
  TOP_SLOTS_FIRST_WALL,
  TOP_SLOTS_PER_WALL,
  type ShelfItem,
  type ShelfLayout,
  type StandingSlot,
  type Wall,
} from './shelf';
export { buildTimeline, type DayEntry } from './timeline';
export { WINDOW_VIEWS, windowView, type WindowView } from './scene/windowView';
export { drawWindow, GLASS, WINDOW_SIZE } from './scene/drawWindow';
export { drawSlot, type SlotKind } from './scene/drawSlot';
export {
  composeRoom,
  planRoom,
  type PlacedContent,
  type PlacedItem,
  type PlanRoomParams,
  type RoomImage,
  type RoomPlan,
  type RoomSource,
  type RowBand,
  type WallPlan,
} from './scene/roomPlan';
export { drawFloor, FLOOR_ROWS, FLOOR_TOP, type DrawFloorParams } from './scene/drawFloor';
export type {
  LightTone,
  RoomTone,
  SceneImage,
  SceneLayer,
  ScenePixel,
  SceneTone,
  WindowTone,
} from './scene/sceneImage';
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
