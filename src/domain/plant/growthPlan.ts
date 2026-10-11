import { MAX_GROWTH_DAYS, type PlantTone } from './grid';

export interface Stroke {
  readonly x: number;
  readonly y: number;
  readonly tone: PlantTone;
}

/** Strokes of each growth day: entry 0 holds day 1, entry 119 holds day 120. */
export type GrowthPlan = readonly (readonly Stroke[])[];

/**
 * A part of a plant that can make a small gesture of its own (a leaf that
 * dips, the end of a vine that swings): how it moves, for a second, before
 * it comes back. See gesture.ts.
 */
export interface PartSpec {
  /** Cells to the right while it moves (the species' own left and right). */
  readonly dx: number;
  /** Cells down while it moves. */
  readonly dy: number;
  /**
   * Only the end of the part moves: its strokes of the highest ranks grown
   * so far, this many ranks deep (the tip of a blade, the last beads of a
   * string). Without it, the whole part moves, once it is fully grown.
   */
  readonly tail?: number;
  /** The part is not drawn while it "moves" (a flower that closes). */
  readonly hide?: boolean;
}

/** The part a stroke belongs to, and how far along it (0 at its base). */
export interface PartTag {
  readonly part: number;
  readonly rank: number;
}

/** The parts of a plan: their specs, and for each day the tag of each cell. */
export interface PartPlan {
  readonly specs: readonly PartSpec[];
  /** Entry 0 holds day 1; keys are cellKey(x, y). */
  readonly tags: readonly ReadonlyMap<number, PartTag>[];
}

/** Key of a cell in a PartPlan, valid a little beyond the grid on every side. */
export function cellKey(x: number, y: number): number {
  return (y + 64) * 256 + (x + 64);
}

/**
 * Collects the strokes of each day while a species is being built.
 * Days outside [1, MAX_GROWTH_DAYS] are ignored, like in the prototype:
 * species may plan beyond the last day without checking.
 *
 * A species may also say which strokes make a part (see PartSpec): it
 * declares the part, marks it, adds its strokes, and unmarks. The strokes
 * themselves are not changed: the drawing stays the prototype's.
 */
export class GrowthPlanBuilder {
  private readonly days: Stroke[][] = Array.from({ length: MAX_GROWTH_DAYS }, () => []);
  private readonly specs: PartSpec[] = [];
  private readonly tags: Map<number, PartTag>[] = Array.from(
    { length: MAX_GROWTH_DAYS },
    () => new Map<number, PartTag>(),
  );
  private marked: PartTag | null = null;

  add(day: number, x: number, y: number, tone: PlantTone): void {
    if (day < 1 || day > MAX_GROWTH_DAYS) return;
    const stroke = { x: Math.round(x), y: Math.round(y), tone };
    this.days[day - 1]!.push(stroke);
    if (!Number.isFinite(stroke.x) || !Number.isFinite(stroke.y)) return;
    // Within a day, the last stroke on a cell wins: so does its part.
    const key = cellKey(stroke.x, stroke.y);
    if (this.marked) this.tags[day - 1]!.set(key, this.marked);
    else this.tags[day - 1]!.delete(key);
  }

  /** Same as add(), with a 0-based day index (0 = day 1), as in the prototype. */
  readonly at = (dayIndex: number, x: number, y: number, tone: PlantTone): void => {
    this.add(dayIndex + 1, x, y, tone);
  };

  /** Declares a part and returns its number. */
  part(spec: PartSpec): number {
    this.specs.push(spec);
    return this.specs.length - 1;
  }

  /** The strokes added from now on belong to this part (null: to none). */
  mark(part: number | null, rank = 0): void {
    this.marked = part === null ? null : { part, rank };
  }

  build(): GrowthPlan {
    return this.days;
  }

  parts(): PartPlan {
    return { specs: this.specs, tags: this.tags };
  }
}
