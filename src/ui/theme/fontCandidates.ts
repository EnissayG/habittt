// Pixel fonts compared for the digits in the Lab (development only). The
// one chosen becomes a theme role; the others will be uninstalled.
import { Jersey10_400Regular } from '@expo-google-fonts/jersey-10/400Regular';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p/400Regular';
import { Silkscreen_400Regular } from '@expo-google-fonts/silkscreen/400Regular';
import { VT323_400Regular } from '@expo-google-fonts/vt323/400Regular';

import { fonts } from './tokens';

export interface FontCandidate {
  label: string;
  /** Family for the big counter. */
  counter: string;
  /** Family for the labels. */
  label12: string;
}

/** Files to load, keyed by family name. */
export const CANDIDATE_FILES = {
  Silkscreen_400Regular,
  VT323_400Regular,
  PressStart2P_400Regular,
  Jersey10_400Regular,
};

export const FONT_CANDIDATES: readonly FontCandidate[] = [
  { label: 'Pixelify Sans (actuelle)', counter: fonts.displayBold, label12: fonts.display },
  { label: 'Silkscreen', counter: 'Silkscreen_400Regular', label12: 'Silkscreen_400Regular' },
  { label: 'VT323', counter: 'VT323_400Regular', label12: 'VT323_400Regular' },
  {
    label: 'Press Start 2P',
    counter: 'PressStart2P_400Regular',
    label12: 'PressStart2P_400Regular',
  },
  { label: 'Jersey 10', counter: 'Jersey10_400Regular', label12: 'Jersey10_400Regular' },
];
