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
 * Semantic colors used by screens. Only `text`, `muted` and `onAccent` may
 * color text, and only on the backgrounds listed in TEXT_PAIRS (checked by
 * contrast.test.ts: every pair is at least 4.5:1).
 */
export const colors = {
  background: solarized.base3,
  /** Quiet fills (neutral button, chips). Only `text` goes on it. */
  surface: solarized.base2,
  /** Text inputs (from the mockup). */
  field: '#FFF9E9',
  border: solarized.base1,
  text: solarized.base02,
  muted: solarized.base01,
  accent: solarized.green,
  onAccent: solarized.base03,
  clean: solarized.green,
  relapse: solarized.orange,
} as const;

type ColorRole = keyof typeof colors;

/** Every [text, background] combination the screens are allowed to use. */
export const TEXT_PAIRS: readonly (readonly [ColorRole, ColorRole])[] = [
  ['text', 'background'],
  ['muted', 'background'],
  ['text', 'surface'],
  ['text', 'field'],
  ['muted', 'field'],
  ['onAccent', 'accent'],
];

/** Minimum contrast for running text (WCAG AA). */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * Typographic roles. Screens use the role, never a font name.
 * Each weight of a custom font is its own family in React Native (fontWeight
 * cannot pick it); the pixel font files are loaded in useAppFonts.
 * - display: titles and names (Pixelify Sans Medium).
 * - displayBold: the app name and big counters (Pixelify Sans SemiBold).
 * - body: running text, kept in the readable system font.
 */
export const fonts = {
  display: 'PixelifySans_500Medium',
  displayBold: 'PixelifySans_600SemiBold',
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const satisfies Record<string, string>;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
