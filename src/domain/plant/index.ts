export { usedRows, type RowRange } from './bounds';
export {
  computeGenome,
  FOLIAGES,
  isRareTrait,
  POT_COLORS,
  POT_PATTERNS,
  POT_SHAPES,
  TRAITS,
  type FoliageId,
  type Genome,
  type PotColorId,
  type PotPatternId,
  type PotShapeId,
  type TraitId,
} from './genome';
export {
  MAX_GROWTH_DAYS,
  PLANT_GRID,
  type PlantImage,
  type PlantPixel,
  type PlantTone,
  type SceneryTone,
  type Tone,
} from './grid';
export type { GrowthPlan, Stroke } from './growthPlan';
export {
  FALLBACK_SPECIES_ID,
  isSpeciesId,
  resolveSpecies,
  SPECIES_IDS,
  SPECIES_REGISTRY,
  type SpeciesId,
} from './registry';
export {
  planPlant,
  renderPlant,
  rimRow,
  shelfRowsUnderPot,
  type RenderPlantParams,
} from './renderPlant';
export type { Species, SpeciesContext, SpeciesPlan } from './species';
