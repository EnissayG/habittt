export {
  checkHabitName,
  createHabit,
  HABIT_NAME_MAX_LENGTH,
  HABIT_STATUSES,
  type CreateHabitDeps,
  type CreateHabitError,
  type CreateHabitInput,
  type Habit,
  type HabitId,
  type HabitStatus,
} from './habit';
export {
  eraseHabit,
  growthEnd,
  isOnShelf,
  retireHabit,
  type RetireError,
} from './retirement';
export {
  journalMonths,
  monthCalendar,
  monthEntries,
  monthOf,
  noteMonth,
  type CalendarDay,
  type MonthId,
} from './calendar';
export { normalizeHabitName } from './habitName';
export {
  isActiveNote,
  MOODS,
  NOTE_MAX_LENGTH,
  noteIdFor,
  writeNote,
  type Mood,
  type Note,
  type WriteNoteError,
  type WriteNoteOutcome,
  type WriteNoteParams,
} from './note';
export {
  createHabitTracker,
  type AddHabitInput,
  type HabitAccessError,
  type HabitDetail,
  type HabitSummary,
  type HabitTracker,
  type HabitTrackerDeps,
  type NoteInput,
  type SaveNoteError,
  type WaterTodayError,
  type Shelf,
  type ToggleRelapseError,
} from './habitTracker';
export {
  arrangeShelf,
  MIN_PLANT_WALLS,
  SHELVES_PER_WALL,
  SLOTS_PER_SHELF,
  TOP_SLOTS_FIRST_WALL,
  TOP_SLOTS_PER_WALL,
  type DecorWall,
  type PlantsWall,
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
  type FloorItem,
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
export type {
  HabitRepository,
  NoteRepository,
  RelapseRepository,
  WateringRepository,
} from './repositories';
export { err, ok, type Result } from './result';
export { water, wateringIdFor, type WaterError, type Watering } from './watering';
export { computeStats, type ComputeStatsParams, type HabitStats } from './stats';
