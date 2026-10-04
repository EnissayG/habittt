import type { Species } from './species';
import { aloe } from './species/aloe';
import { cactus } from './species/cactus';
import { calathea } from './species/calathea';
import { fern } from './species/fern';
import { ficus } from './species/ficus';
import { jade } from './species/jade';
import { monstera } from './species/monstera';
import { pothos } from './species/pothos';
import { sansevieria } from './species/sansevieria';
import { spider } from './species/spider';

/**
 * Every known species. The ONLY file to edit when adding one.
 * Keys are stored in the database: never rename one.
 */
export const SPECIES_REGISTRY = {
  monstera,
  pothos,
  calathea,
  jade,
  sansevieria,
  spider,
  cactus,
  aloe,
  fern,
  ficus,
} as const satisfies Record<string, Species>;

export type SpeciesId = keyof typeof SPECIES_REGISTRY;

export const SPECIES_IDS = Object.keys(SPECIES_REGISTRY) as SpeciesId[];

/** Drawn when a habit's species is unknown (e.g. synced from a newer app). */
export const FALLBACK_SPECIES_ID: SpeciesId = 'monstera';

export function isSpeciesId(value: string): value is SpeciesId {
  return Object.prototype.hasOwnProperty.call(SPECIES_REGISTRY, value);
}

export function resolveSpecies(id: string): { species: Species; fallback: boolean } {
  return isSpeciesId(id)
    ? { species: SPECIES_REGISTRY[id], fallback: false }
    : { species: SPECIES_REGISTRY[FALLBACK_SPECIES_ID], fallback: true };
}
