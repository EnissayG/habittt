import { Platform } from 'react-native';

export const colors = {
  background: '#F5F0E1',
  text: '#2E2A24',
} as const;

// System monospace fonts: no font package needed, works in Expo Go.
export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;
