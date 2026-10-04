import type { Genome } from './genome';

/**
 * Plant canvas size. The ONLY place it is defined: species receive it through
 * their build context and must not assume these numbers.
 */
export const PLANT_GRID = { width: 48, height: 64 } as const;

/** A plant grows for this many days, then stays as it is on the last day. */
export const MAX_GROWTH_DAYS = 120;

/**
 * Symbolic colors. The domain says WHAT a pixel is; the UI theme decides how
 * it looks, from the plant's genome (foliage hue, trait, pot color) and the
 * pixel's flags (relapse, and later vitality).
 */
export type PlantTone =
  | 'leafDark'
  | 'leaf'
  | 'leafLight'
  | 'leafDeep'
  | 'leafPale'
  | 'leafAccent'
  | 'stripe'
  | 'spine'
  | 'bark'
  | 'barkDark'
  | 'flower'
  | 'bud'
  | 'succulent'
  | 'succulentDark'
  | 'succulentLight'
  /** Patches of the rare trait (variegated, pink, golden). */
  | 'trait';

export type SceneryTone =
  'soil' | 'pot' | 'potShade' | 'potPattern' | 'potPatternShade' | 'shelf' | 'shelfShade';

export type Tone = PlantTone | SceneryTone;

export interface PlantPixel {
  readonly tone: Tone;
  /** Growth day that drew this pixel (1 = start day); 0 for pot and shelf. */
  readonly day: number;
  /** True if `day` is a relapse day. */
  readonly relapse: boolean;
}

export interface PlantImage {
  readonly width: number;
  readonly height: number;
  /** Row-major: pixel (x, y) is at index y * width + x. null = empty. */
  readonly pixels: readonly (PlantPixel | null)[];
  /** Species actually drawn (the fallback one if the requested id is unknown). */
  readonly species: string;
  /** Variety id picked from the seed (null if the species has none). */
  readonly variety: string | null;
  /** What the seed varies besides the shape: pot, foliage hue, mirror, trait. */
  readonly genome: Genome;
  /** True when the requested species was unknown and a fallback was drawn. */
  readonly fallback: boolean;
}
