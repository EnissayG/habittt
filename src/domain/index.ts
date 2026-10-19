export {
  checkHabitName,
  createHabit,
  HABIT_NAME_MAX_LENGTH,
  renameHabit,
  HABIT_STATUSES,
  type CreateHabitDeps,
  type CreateHabitError,
  type CreateHabitInput,
  type Habit,
  type HabitId,
  type HabitStatus,
} from './habit';
export { eraseHabit, growthEnd, isOnShelf, retireHabit, type RetireError } from './retirement';
export {
  journalMonths,
  monthCalendar,
  monthEntries,
  monthOf,
  nextMonth,
  noteMonth,
  previousMonth,
  type CalendarDay,
  type MonthId,
} from './calendar';
export {
  buildExport,
  EXPORT_FORMAT,
  type ExportData,
  type ExportedHabit,
  type HabitRows,
} from './exportData';
export { normalizeHabitName } from './habitName';
export { record, splitLives, type Life, type SplitLivesParams } from './lives';
export {
  BREATH,
  BREATH_SECONDS,
  breathAt,
  BREATH_PULSES,
  breathFullness,
  breathWord,
  sessionShare,
  WORD_FADE,
  pulsesBetween,
  type BreathPulse,
  type PulseStrength,
  isOver,
  MEDITATION_BONSAI,
  MEDITATION_LENGTHS,
  PULSE_GAP,
  MEDITATIONS,
  minutesLeft,
  type Breath,
  type Meditation,
  type MeditationMinutes,
} from './meditation';
export {
  replant,
  replantingIdFor,
  replantSeed,
  type ReplantError,
  type Replanting,
  type ReplantParams,
} from './replanting';
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
  type HerbariumEntry,
  type HerbariumLife,
  type RenameHabitError,
  type ReplantHabitError,
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
export { DAYLIGHT, drawWindow, GLASS, WINDOW_SIZE } from './scene/drawWindow';
export { drawSlot, type SlotKind } from './scene/drawSlot';
export { drawSparkles, drawSun, SPARKLE_CYCLE, SUN } from './scene/drawSun';
export {
  CAT_BREEDS,
  CAT_BEAT,
  CAT_FEET,
  CAT_FRAME_COUNT,
  CAT_FRAMES,
  CAT_SIZE,
  CAT_HOP,
  CAT_SPEED,
  catAt,
  drawCat,
  type CatBreed,
  type CatImage,
  type CatPose,
  type CatState,
  type CatTone,
} from './scene/cat';
export {
  CAT_HEART,
  catReaction,
  HEART_LIFE,
  type CatHeart,
  type CatReaction,
  type CatTouch,
  type CatTouchKind,
} from './scene/catTouch';
export {
  drawPlaque,
  PLAQUE_HOOK_ROWS,
  PLAQUE_METALS,
  PLAQUE_MIN,
  glintAt,
  PLAQUE_TURN,
  plaqueShine,
  type PlaqueTurn,
  plaqueTier,
  type PlaqueMetal,
  type PlaqueTier,
} from './scene/plaque';
export {
  LIGHT_TONES,
  lightLevel,
  reflectLights,
  roomLights,
  type ReflectedCell,
  type LightKind,
  type LightSource,
} from './scene/lights';
export {
  drawCushion,
  drawFlame,
  drawIncenseTimer,
  drawLowTable,
  drawMat,
  drawSmoke,
  drawVase,
  drawWallpaper,
  drawSign,
  SIGN_PLANK,
  SIGN_SIZE,
  garlandBulbs,
  CEILING_ROWS,
  BULB_EVERY,
  drawWallShelf,
  FLAME_SIZE,
  INCENSE_TIMER_SIZE,
  SMOKE_SIZE,
} from './scene/drawCorner';
export {
  composeRoom,
  planRoom,
  MEDITATION_PIECES,
  type AnimatedDecor,
  type DecorPiece,
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
export {
  drawFloor,
  drawFloorBoards,
  drawFloorItems,
  FLOOR_ROWS,
  FLOOR_TOP,
  mirrorRows,
  REFLECTION,
  type DrawFloorParams,
  type MirrorRow,
} from './scene/drawFloor';
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
  MeditationRepository,
  NoteRepository,
  RelapseRepository,
  SettingsRepository,
  ReplantingRepository,
  WateringRepository,
} from './repositories';
export { err, ok, type Result } from './result';
export { water, wateringIdFor, type WaterError, type Watering } from './watering';
export { computeStats, type ComputeStatsParams, type HabitStats } from './stats';
export {
  clampGoal,
  MEDITATION_GOAL,
  MEDITATION_PLANT,
  meditationDayIdFor,
  meditationMonth,
  meditationSummary,
  MIN_MINUTES,
  recordMeditation,
  type MeditationCalendarDay,
  type MeditationDay,
  type MeditationSummary,
  type RecordMeditationError,
} from './meditationLog';
export {
  DEFAULT_SETTINGS,
  readSettings,
  SETTING_KEYS,
  writeSetting,
  type SettingKey,
  type Settings,
} from './settings';
