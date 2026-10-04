/**
 * Plant canvas size. The ONLY place it is defined: species receive it through
 * their build context and must not assume these numbers.
 */
export const PLANT_GRID = { width: 48, height: 64 } as const;

/** A plant grows for this many days, then stays as it is on the last day. */
export const MAX_GROWTH_DAYS = 120;

/** Number of pot variants; the UI theme gives each one its colors. */
export const POT_STYLE_COUNT = 6;

/**
 * Symbolic colors. The domain says WHAT a pixel is; the UI theme decides how
 * it looks (and can vary it for relapses or, later, vitality).
 */
export type PlantTone = 'leafDark' | 'leaf' | 'leafLight' | 'leafDeep' | 'leafAccent' | 'bark';

export type SceneryTone = 'soil' | 'pot' | 'potShade' | 'shelf' | 'shelfShade';

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
  /** Pot variant in [0, POT_STYLE_COUNT). */
  readonly potStyle: number;
  /** Species actually drawn (the fallback one if the requested id is unknown). */
  readonly species: string;
  /** True when the requested species was unknown and a fallback was drawn. */
  readonly fallback: boolean;
}
