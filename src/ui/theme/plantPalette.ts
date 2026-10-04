import type { PlantPixel, PlantTone } from '../../domain';
import { solarized } from './tokens';

/**
 * Real colors of the symbolic plant tones, on the Solarized Light palette
 * (taken from the prototype). A relapse day is drawn "yellowed": the same
 * shape, warmer and paler.
 */
const HEALTHY: Record<PlantTone, string> = {
  leafDark: '#5F7000',
  leaf: solarized.green,
  leafLight: '#A8BD2A',
  leafDeep: '#46580A',
  leafAccent: solarized.violet,
  bark: '#7A5230',
};

const YELLOWED: Record<PlantTone, string> = {
  leafDark: '#946F00',
  leaf: solarized.yellow,
  leafLight: '#D9B44A',
  leafDeep: '#7A5C00',
  leafAccent: solarized.base1,
  bark: '#C9A227',
};

/** One [body, shade] pair per pot style (PlantImage.potStyle). */
const POTS: readonly (readonly [string, string])[] = [
  [solarized.orange, '#A53C12'],
  [solarized.blue, '#1E6FA8'],
  [solarized.violet, '#565A9D'],
  [solarized.magenta, '#A92B68'],
  [solarized.cyan, '#22817A'],
  [solarized.base1, '#768181'],
];

const SCENERY = {
  soil: '#5B4636',
  shelf: solarized.yellow,
  shelfShade: '#93710A',
} as const;

/**
 * Plant vitality, applied as a color variation (never a shape change).
 * Planned for the next step: both values are accepted but have no effect yet.
 */
export interface Vitality {
  /** 0 = watered, 1 = very thirsty. */
  thirst: number;
  /** 0 = rested, 1 = very tired (several close relapses). */
  fatigue: number;
}

export const NEUTRAL_VITALITY: Vitality = { thirst: 0, fatigue: 0 };

export function plantColor(
  pixel: PlantPixel,
  potStyle: number,
  // Not used yet: kept in the signature so callers already pass it.
  _vitality: Vitality = NEUTRAL_VITALITY,
): string {
  switch (pixel.tone) {
    case 'soil':
    case 'shelf':
    case 'shelfShade':
      return SCENERY[pixel.tone];
    case 'pot':
    case 'potShade': {
      const [body, shade] = POTS[potStyle] ?? POTS[0]!;
      return pixel.tone === 'pot' ? body : shade;
    }
    default:
      return (pixel.relapse ? YELLOWED : HEALTHY)[pixel.tone];
  }
}
