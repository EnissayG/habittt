import type { GrowthPlan } from './growthPlan';
import type { Random } from './random';

/** Everything a species may use to plan its growth. */
export interface SpeciesContext {
  /** Seeded generator; the only source of variety. */
  readonly random: Random;
  readonly width: number;
  readonly height: number;
  /** Column of the pot's center. */
  readonly anchorX: number;
  /** Row of the pot's rim (soil line). Plants grow up from it, or hang below it. */
  readonly rimY: number;
}

/**
 * A plant species. Contract:
 * - build() plans all MAX_GROWTH_DAYS days at once and depends only on ctx;
 * - every stroke must lie inside the grid (strokes behind the pot are hidden);
 * - every day must draw at least one visible pixel.
 * Adding a species = one new file + one line in registry.ts.
 */
export interface Species {
  readonly id: string;
  /** Hanging plants sit on a high shelf and drape down. */
  readonly hanging: boolean;
  build(ctx: SpeciesContext): GrowthPlan;
}
