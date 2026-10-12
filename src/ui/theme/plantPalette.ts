import type { FoliageId, Genome, PlantPixel, PlantTone, PotColorId, TraitId } from '../../domain';
import { solarized } from './tokens';

// Real colors of the symbolic plant tones, on the Solarized Light palette.
// Values come from the prototype (docs/prototypes/plants.js) so the app draws
// the same plants; the parity test checks them pixel by pixel.

type FoliageTone =
  'leafLight' | 'leaf' | 'leafDark' | 'leafDeep' | 'succulent' | 'succulentDark' | 'succulentLight';

/** Tones that follow the plant's foliage hue. */
const FOLIAGE: Record<FoliageId, Record<FoliageTone, string>> = {
  classic: {
    leafLight: '#A8BD2A',
    leaf: solarized.green,
    leafDark: '#5F7000',
    leafDeep: '#46580A',
    succulent: solarized.cyan,
    succulentDark: '#1F7A72',
    succulentLight: '#5FC4B8',
  },
  forest: {
    leafLight: '#7FA650',
    leaf: '#4F8A3C',
    leafDark: '#356B2E',
    leafDeep: '#234F22',
    succulent: '#3F8F5A',
    succulentDark: '#2C6E44',
    succulentLight: '#6FB884',
  },
  tender: {
    leafLight: '#C9D64A',
    leaf: '#A3B818',
    leafDark: '#7A8C0C',
    leafDeep: '#5C6B08',
    succulent: '#8FAE3A',
    succulentDark: '#6C8A22',
    succulentLight: '#B5CC66',
  },
  bluish: {
    leafLight: '#7FC4A8',
    leaf: '#3F9E82',
    leafDark: '#2A7862',
    leafDeep: '#1C5A49',
    succulent: '#4A90B8',
    succulentDark: '#356F92',
    succulentLight: '#7DB6D6',
  },
};

/** Tones that keep the same color whatever the foliage. */
const FIXED: Record<Exclude<PlantTone, FoliageTone | 'trait'>, string> = {
  leafPale: '#D8E08A',
  leafAccent: solarized.violet,
  stripe: solarized.base2,
  spine: solarized.base3,
  bark: '#7A5230',
  barkDark: '#5E3D22',
  flower: solarized.magenta,
  bud: solarized.red,
};

const TRAIT: Record<TraitId, string> = {
  none: '#E6EBA8',
  variegated: '#E6EBA8',
  pink: '#E79AB8',
  golden: '#E0B030',
};

/** A relapse day is drawn "yellowed": same shape, warmer and paler. */
const YELLOWED: Record<PlantTone, string> = {
  leafPale: '#D9B44A',
  barkDark: '#946F00',
  leafDark: '#946F00',
  leaf: solarized.yellow,
  leafLight: '#D9B44A',
  leafDeep: '#7A5C00',
  stripe: '#E8D9A0',
  spine: '#E8D9A0',
  bark: '#C9A227',
  flower: solarized.base1,
  bud: solarized.base1,
  leafAccent: solarized.base1,
  succulent: solarized.yellow,
  succulentDark: '#946F00',
  succulentLight: '#D9B44A',
  trait: '#C9A227',
};

/**
 * A plant whose life is over is drawn dried: same shades, in straw and dead
 * wood. Never red, never grey: it is a dry plant, not a reproach.
 */
const DRIED: Record<PlantTone, string> = {
  leafPale: '#CDB47C',
  leafLight: '#CDB47C',
  succulentLight: '#CDB47C',
  trait: '#CDB47C',
  stripe: '#DCCB9C',
  spine: '#DCCB9C',
  leaf: '#AE8F58',
  succulent: '#AE8F58',
  leafDark: '#8A6C3E',
  succulentDark: '#8A6C3E',
  leafDeep: '#6A5230',
  bark: '#857159',
  barkDark: '#64533F',
  flower: '#B39C80',
  bud: '#B39C80',
  leafAccent: '#B39C80',
};

/** Soil that is no longer watered. */
const DRY_SOIL = '#8A735A';

/** One [body, shade] pair per pot color. */
const POTS: Record<PotColorId, readonly [string, string]> = {
  terracotta: [solarized.orange, '#A53C12'],
  blue: [solarized.blue, '#1E6FA8'],
  violet: [solarized.violet, '#565A9D'],
  pink: [solarized.magenta, '#A92B68'],
  turquoise: [solarized.cyan, '#22817A'],
  grey: [solarized.base1, '#768181'],
};

/**
 * Shelf and soil colors, also used for the shelf's empty slots. The shelves
 * are part of the room: their wood follows the room's style (ADR 0019), not
 * the prototype's yellow.
 */
export const SCENERY = {
  soil: '#5B4636',
  potPattern: solarized.base2,
  potPatternShade: '#C9C2AC',
  shelf: '#A0703F',
  shelfShade: '#6E4A2A',
} as const;

/**
 * Plant vitality, applied as a color variation (never a shape change).
 * Planned for a later step: both values are accepted but have no effect yet.
 */
export interface Vitality {
  /** 0 = watered, 1 = very thirsty. */
  thirst: number;
  /** 0 = rested, 1 = very tired (several close relapses). */
  fatigue: number;
}

export const NEUTRAL_VITALITY: Vitality = { thirst: 0, fatigue: 0 };

function isFoliageTone(tone: PlantTone): tone is FoliageTone {
  return tone in FOLIAGE.classic;
}

/** The small flower that marks a watered day: a soft pink, apart from the magenta flowers. */
export const BLOOM = '#F59AC4';

export function plantColor(
  pixel: PlantPixel,
  genome: Genome,
  // Not used yet: kept in the signature so callers already pass it.
  _vitality: Vitality = NEUTRAL_VITALITY,
): string {
  // The small flower of a watered day: one pixel, whatever it was.
  if (pixel.bloom) return BLOOM;
  switch (pixel.tone) {
    case 'soil':
      return pixel.dry ? DRY_SOIL : SCENERY.soil;
    case 'potPattern':
    case 'potPatternShade':
    case 'shelf':
    case 'shelfShade':
      return SCENERY[pixel.tone];
    case 'pot':
      return POTS[genome.potColor][0];
    case 'potShade':
      return POTS[genome.potColor][1];
    default: {
      const tone = pixel.tone;
      if (pixel.dry) return DRIED[tone];
      if (pixel.relapse) return YELLOWED[tone];
      if (tone === 'trait') return TRAIT[genome.trait];
      if (isFoliageTone(tone)) return FOLIAGE[genome.foliage][tone];
      return FIXED[tone];
    }
  }
}
