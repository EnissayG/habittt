// Per-weight entry points: the package root would bundle all four weights.
import { PixelifySans_500Medium } from '@expo-google-fonts/pixelify-sans/500Medium';
import { PixelifySans_600SemiBold } from '@expo-google-fonts/pixelify-sans/600SemiBold';
import { useFonts } from 'expo-font';

import { fonts } from './tokens';

// Keys are the family names used by the theme roles.
const FONT_FILES = {
  [fonts.display]: PixelifySans_500Medium,
  [fonts.displayBold]: PixelifySans_600SemiBold,
};

/**
 * Loads the pixel font. Returns true once the app can render: when the font
 * is loaded, or when loading failed (text then falls back to the system
 * font rather than blocking the app).
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(FONT_FILES);
  return loaded || error !== null;
}
