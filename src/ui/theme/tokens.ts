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
 * Semantic colors used by screens. Text pairs were chosen for contrast:
 * text on background ~13:1, muted on background 4.99:1, onAccent on accent
 * 4.69:1, onDanger on danger 4.29:1.
 */
export const colors = {
  background: solarized.base3,
  surface: solarized.base2,
  border: solarized.base1,
  text: solarized.base02,
  muted: solarized.base01,
  accent: solarized.green,
  onAccent: solarized.base03,
  danger: solarized.red,
  onDanger: solarized.base3,
  clean: solarized.green,
  relapse: solarized.orange,
} as const;

/**
 * Two typographic roles. Screens use the role, never a font name.
 * - display: app name, titles and counters (pixel font, to be chosen;
 *   system monospace until then).
 * - body: running text, kept in the readable system font.
 */
export const fonts = {
  display: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
