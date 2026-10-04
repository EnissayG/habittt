import { Platform } from 'react-native';

export const colors = {
  background: '#F5F0E1',
  surface: '#FBF8EF',
  border: '#D9D0BA',
  text: '#2E2A24',
  muted: '#7A7264',
  accent: '#4F7A3A',
  onAccent: '#FBF8EF',
  clean: '#7FA65A',
  relapse: '#C2603F',
  danger: '#A8432A',
} as const;

// System monospace fonts: no font package needed, works in Expo Go.
export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
