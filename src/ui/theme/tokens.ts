import { Platform } from 'react-native';

/** Solarized Light palette (Ethan Schoonover). Screens never use it directly. */
export const solarized = {
  base03: '#002B36',
  base02: '#073642',
  base01: '#586E75',
  base00: '#657B83',
  base0: '#839496',
  base1: '#93A1A1',
  base2: '#EEE8D5',
  base3: '#FDF6E3',
  yellow: '#B58900',
  orange: '#CB4B16',
  red: '#DC322F',
  magenta: '#D33682',
  violet: '#6C71C4',
  blue: '#268BD2',
  cyan: '#2AA198',
  green: '#859900',
} as const;

/**
 * Semantic colors used by screens (the mockup's "Règles communes"). Only
 * `text`, `muted`, `onAccent`, `onStrong` and `onRelapse` may color text, and only on the
 * backgrounds listed in TEXT_PAIRS (checked by contrast.test.ts: every pair
 * is at least 4.5:1).
 */
export const colors = {
  background: solarized.base3,
  /** Quiet fills (neutral button, chips). Only `text` goes on it. */
  surface: solarized.base2,
  /** Text inputs (from the mockup). */
  field: '#FFF9E9',
  /** Thin rules, tile borders, neutral button edge (from the mockup). */
  line: '#D3CBB7',
  border: solarized.base1,
  text: solarized.base02,
  muted: solarized.base01,
  accent: solarized.green,
  /** The darker bottom edge of the action button. */
  accentEdge: '#5F7000',
  onAccent: solarized.base03,
  /** Selected chips and tiles. */
  strong: solarized.base02,
  onStrong: solarized.base3,
  /** Notes (pink) and water (blue) marks. */
  note: solarized.magenta,
  water: solarized.blue,
  clean: solarized.green,
  relapse: solarized.orange,
  /** Day numbers on a relapse day of the journal (white: the dark text is too faint on orange). */
  onRelapse: '#FFFFFF',
  /** Marks standing on the dark floor (the wall indicator): current, other. */
  onFloor: solarized.base3,
  onFloorMuted: '#D3CBB7',
  /** Dimmed screen behind a sheet. */
  dim: 'rgba(7, 54, 66, 0.38)',
  /**
   * The room with the lights off, laid over everything (ADR 0020): how dark
   * depends on the hour, the daylight still comes in. Then the window, which
   * darkens less than the room.
   */
  darknessDay: 'rgba(3, 18, 24, 0.4)',
  darknessEvening: 'rgba(3, 18, 24, 0.65)',
  darkness: 'rgba(3, 18, 24, 0.86)',
  windowDarknessDay: 'rgba(3, 18, 24, 0.1)',
  windowDarknessEvening: 'rgba(3, 18, 24, 0.3)',
  windowDarkness: 'rgba(3, 18, 24, 0.45)',
  /** The bare wall under each darkness (base3 seen through it), for the contrast checks. */
  darkRoomDay: '#999B92',
  darkRoomEvening: '#5A625F',
  darkRoom: '#263234',
  /** Text in the dark room: the header and the labels. */
  textInDark: solarized.base2,
  /** The word on the wooden sign of the meditation corner (on the low table's wood). */
  onWood: solarized.base3,
  wood: '#8A5A32',
  mutedInDark: solarized.base1,
} as const;

type ColorRole = keyof typeof colors;

/** Every color role, with its value: one palette for the lights on, one for the lights off. */
export type Palette = Record<ColorRole, string>;

/**
 * The lights off (ADR 0021): every screen goes dark, in the colors of the
 * dark room at night (its wall seen through the darkness), Solarized's dark
 * tones for the text. The roles keep their meaning: what is text stays text,
 * what is quiet stays quiet. The room's own roles (darkness, onWood...) do
 * not change: the room is drawn lit, then darkened.
 */
export const darkColors: Palette = {
  ...colors,
  background: '#1F2A2C',
  surface: '#2C3A3D',
  field: '#253234',
  line: '#3B4B4E',
  border: '#5C6E70',
  text: solarized.base2,
  muted: solarized.base1,
  accent: solarized.green,
  accentEdge: '#5F7000',
  onAccent: solarized.base03,
  strong: solarized.base2,
  onStrong: solarized.base03,
  onFloor: solarized.base2,
  onFloorMuted: '#6F8083',
  dim: 'rgba(0, 0, 0, 0.5)',
};

export const PALETTES = { light: colors as Palette, dark: darkColors } as const;

/** Every [text, background] combination the screens are allowed to use. */
export const TEXT_PAIRS: readonly (readonly [ColorRole, ColorRole])[] = [
  ['text', 'background'],
  ['muted', 'background'],
  ['text', 'surface'],
  ['text', 'field'],
  ['muted', 'field'],
  ['onAccent', 'accent'],
  ['onStrong', 'strong'],
  ['onAccent', 'clean'],
  ['onRelapse', 'relapse'],
];

/**
 * The text drawn in the room itself, with the lights on or off (ADR 0020):
 * the room is always drawn lit, then darkened, so these pairs are checked in
 * the light palette only.
 */
export const ROOM_TEXT_PAIRS: readonly (readonly [ColorRole, ColorRole])[] = [
  ['text', 'darkRoomDay'],
  ['textInDark', 'darkRoomEvening'],
  ['textInDark', 'darkRoom'],
  ['mutedInDark', 'darkRoom'],
  ['onWood', 'wood'],
];

/** Marks drawn on the floor planks; checked against every plank tone (at least 3:1). */
export const FLOOR_MARKS: readonly ColorRole[] = ['onFloor', 'onFloorMuted'];

/** Minimum contrast for running text (WCAG AA). */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * Typographic roles. Screens use the role, never a font name.
 * Each weight of a custom font is its own family in React Native (fontWeight
 * cannot pick it); the pixel font files are loaded in useAppFonts.
 * - display: titles and names (Pixelify Sans Medium).
 * - displayBold: the app name (Pixelify Sans SemiBold).
 * - numeric: every number, counters included (Jersey 10: its 5, 8, 6 and 1
 *   are told apart at a glance, where Pixelify's 951 read as 981).
 * - body: running text, kept in the readable system font.
 */
export const fonts = {
  display: 'PixelifySans_500Medium',
  displayBold: 'PixelifySans_600SemiBold',
  numeric: 'Jersey10_400Regular',
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const satisfies Record<string, string>;

/**
 * Jersey 10's capitals (and digits) are 0.536 em tall, Pixelify Sans's and
 * the system font's about 0.70 em: numbers in a line of text are drawn this
 * much larger so they look the same height as the words around them.
 */
export const NUMERIC_SCALE = 1.3;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
