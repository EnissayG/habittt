import { fnv1a, mulberry32 } from './random';

// What the seed varies besides the species' own shape. Port of genome() from
// the prototype: same random sequence, same weighted picks. The domain only
// returns ids; colors and French labels live in the UI.

export const FOLIAGES = [
  { id: 'classic', weight: 40 },
  { id: 'forest', weight: 22 },
  { id: 'tender', weight: 22 },
  { id: 'bluish', weight: 16 },
] as const;

/** `percent`: share of the leaf cells (by 2×2 block) covered by the trait. */
export const TRAITS = [
  { id: 'none', weight: 80, percent: 0 },
  { id: 'variegated', weight: 14, percent: 16 },
  { id: 'pink', weight: 5, percent: 14 },
  { id: 'golden', weight: 1, percent: 22 },
] as const;

/** A trait this unlikely (weight 5 or less out of 100) counts as rare. */
const RARE_WEIGHT = 5;

export const POT_COLORS = ['terracotta', 'blue', 'violet', 'pink', 'turquoise', 'grey'] as const;

/** Half-width of the pot for each of the 10 rows below the rim. */
export const POT_SHAPES = [
  { id: 'flared', halfWidths: [7, 7, 6, 6, 6, 5, 5, 5, 4, 4] },
  { id: 'straight', halfWidths: [7, 7, 6, 6, 6, 6, 6, 6, 6, 6] },
  { id: 'round', halfWidths: [6, 7, 7, 7, 7, 7, 6, 6, 5, 4] },
] as const;

/** Bonsai tray: a shallow body, then feet (rows of width 0). */
export const TRAY_SHAPE = { id: 'tray', halfWidths: [10, 10, 9, 9, 9, 8, 0, 0, 0, 0] } as const;

export const POT_PATTERNS = ['plain', 'band', 'dots'] as const;

export type FoliageId = (typeof FOLIAGES)[number]['id'];
export type TraitId = (typeof TRAITS)[number]['id'];
export type PotColorId = (typeof POT_COLORS)[number];
export type PotShapeId = (typeof POT_SHAPES)[number]['id'] | typeof TRAY_SHAPE.id;
export type PotPatternId = (typeof POT_PATTERNS)[number];

export interface Genome {
  readonly potColor: PotColorId;
  readonly potShape: PotShapeId;
  /** Always 'plain' on a tray. */
  readonly potPattern: PotPatternId;
  /** The plant grows the other way round (left/right mirror). */
  readonly mirrored: boolean;
  readonly foliage: FoliageId;
  readonly trait: TraitId;
  /** Salt for placing the trait's patches. */
  readonly salt: number;
}

function pick<T extends { weight: number }>(list: readonly T[], x: number): T {
  const total = list.reduce((sum, item) => sum + item.weight, 0);
  let value = x * total;
  for (const item of list) {
    value -= item.weight;
    if (value < 0) return item;
  }
  return list[0]!;
}

export function computeGenome(speciesId: string, seed: number, onTray: boolean): Genome {
  const random = mulberry32(fnv1a(`${speciesId}#genome`) ^ Math.imul(seed | 0, 40503));
  // Every draw happens even when unused (tray), so the sequence never shifts.
  const potColor = POT_COLORS[Math.floor(random() * POT_COLORS.length)]!;
  const shape = POT_SHAPES[Math.floor(random() * POT_SHAPES.length)]!;
  const pattern = POT_PATTERNS[Math.floor(random() * POT_PATTERNS.length)]!;
  const mirrored = random() < 0.5;
  const foliage = pick(FOLIAGES, random()).id;
  const trait = pick(TRAITS, random()).id;
  const salt = Math.floor(random() * 65536);
  return {
    potColor,
    potShape: onTray ? TRAY_SHAPE.id : shape.id,
    potPattern: onTray ? 'plain' : pattern,
    mirrored,
    foliage,
    trait,
    salt,
  };
}

export function potHalfWidths(shape: PotShapeId): readonly number[] {
  if (shape === TRAY_SHAPE.id) return TRAY_SHAPE.halfWidths;
  return POT_SHAPES.find((candidate) => candidate.id === shape)!.halfWidths;
}

export function traitPercent(trait: TraitId): number {
  return TRAITS.find((candidate) => candidate.id === trait)!.percent;
}

export function isRareTrait(trait: TraitId): boolean {
  return TRAITS.find((candidate) => candidate.id === trait)!.weight <= RARE_WEIGHT;
}
