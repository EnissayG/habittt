import { MAX_GROWTH_DAYS, type PlantTone } from './grid';

export interface Stroke {
  readonly x: number;
  readonly y: number;
  readonly tone: PlantTone;
}

/** Strokes of each growth day: entry 0 holds day 1, entry 119 holds day 120. */
export type GrowthPlan = readonly (readonly Stroke[])[];

/**
 * Collects the strokes of each day while a species is being built.
 * Days outside [1, MAX_GROWTH_DAYS] are ignored, like in the prototype:
 * species may plan beyond the last day without checking.
 */
export class GrowthPlanBuilder {
  private readonly days: Stroke[][] = Array.from({ length: MAX_GROWTH_DAYS }, () => []);

  add(day: number, x: number, y: number, tone: PlantTone): void {
    if (day < 1 || day > MAX_GROWTH_DAYS) return;
    this.days[day - 1]!.push({ x: Math.round(x), y: Math.round(y), tone });
  }

  /** Same as add(), with a 0-based day index (0 = day 1), as in the prototype. */
  readonly at = (dayIndex: number, x: number, y: number, tone: PlantTone): void => {
    this.add(dayIndex + 1, x, y, tone);
  };

  build(): GrowthPlan {
    return this.days;
  }
}
