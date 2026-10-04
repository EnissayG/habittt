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
 * - it may also pick a variety (an id such as 'laurentii') from the same
 *   random sequence; the UI turns ids into labels.
 * The raw plan is then settled (see settle.ts): strokes outside the grid or
 * behind the pot are dropped, and every day is kept visible.
 * Adding a species = one new file + one line in registry.ts.
 */
export interface Species {
  readonly id: string;
  /** Hanging plants sit on a high shelf and drape down. */
  readonly hanging: boolean;
  /** Sits on a shallow tray with feet instead of a pot (bonsai). */
  readonly tray?: boolean;
  build(ctx: SpeciesContext): SpeciesPlan;
}

export interface SpeciesPlan {
  plan: GrowthPlan;
  /** Variety id chosen from the seed, or null for a species without varieties. */
  variety: string | null;
}
