import {
  isRareTrait,
  type FoliageId,
  type Genome,
  type PlantImage,
  type PotColorId,
  type PotPatternId,
  type PotShapeId,
  type SpeciesId,
  type TraitId,
} from '../../domain';

// French labels for the ids the plant generator returns. The texts match the
// prototype's (checked by prototypeParity.test.ts).

export const SPECIES_LABELS: Record<SpeciesId, string> = {
  monstera: 'Monstera',
  pothos: 'Pothos',
  calathea: 'Calathea',
  jade: 'Arbre de jade',
  sansevieria: 'Sansevieria',
  spider: 'Plante araignée',
  cactus: 'Cactus',
  aloe: 'Aloès',
  fern: 'Fougère',
  ficus: 'Caoutchouc',
  bamboo: 'Bambou',
  pearls: 'Collier de perles',
  bonsai: 'Bonsaï',
};

const VARIETY_LABELS: Record<string, string> = {
  trifasciata: 'Trifasciata',
  laurentii: 'Laurentii',
  cylindrica: 'Cylindrica',
  hahnii: 'Hahnii',
  'large-leaf': 'à grandes feuilles',
  'small-leaf': 'à petites feuilles',
  adansonii: 'Adansonii',
  deliciosa: 'Deliciosa',
  bonnie: 'Bonnie (frisée)',
  variegatum: 'Variegatum',
  vittatum: 'Vittatum',
  saguaro: 'Saguaro',
  'organ-pipe': 'Cierges',
  'prickly-pear': 'Figuier de Barbarie',
  maidenhair: 'Capillaire',
  'boston-drooping': 'de Boston (retombante)',
  'boston-upright': 'de Boston (dressée)',
  pearls: 'Perles',
  dolphins: 'Dauphins',
  bananas: 'Bananes',
  medallion: 'Médaillon',
  orbifolia: 'Orbifolia',
  lancifolia: 'Lancifolia',
  chokkan: 'Chokkan (droit)',
  moyogi: 'Moyogi (sinueux)',
  shakan: 'Shakan (incliné)',
  fukinagashi: 'Fukinagashi (battu par le vent)',
};

export const FOLIAGE_LABELS: Record<FoliageId, string> = {
  classic: 'vert classique',
  forest: 'vert forêt',
  tender: 'vert tendre',
  bluish: 'vert bleuté',
};

/** Empty for the common case: no trait is shown. */
export const TRAIT_LABELS: Record<TraitId, string> = {
  none: '',
  variegated: 'panaché',
  pink: 'rosé',
  golden: 'doré',
};

const POT_COLOR_LABELS: Record<PotColorId, string> = {
  terracotta: 'terre cuite',
  blue: 'bleu',
  violet: 'violet',
  pink: 'rose',
  turquoise: 'turquoise',
  grey: 'gris',
};

const POT_SHAPE_LABELS: Record<Exclude<PotShapeId, 'tray'>, string> = {
  flared: 'évasé',
  straight: 'droit',
  round: 'rond',
};

const POT_PATTERN_LABELS: Record<PotPatternId, string> = {
  plain: '',
  band: 'à bande',
  dots: 'à pois',
};

/** Variety label; composite ids (ficus, bamboo) are built from their parts. */
export function varietyLabel(variety: string | null): string {
  if (!variety) return '';
  const canes = /^(spiral-)?(\d+)-canes$/.exec(variety);
  if (canes) return `${canes[1] ? 'spirale, ' : ''}${canes[2]} cannes`;
  const stem = /^(branched|single-stem)(-long-leaf)?$/.exec(variety);
  if (stem) {
    return `${stem[1] === 'branched' ? 'ramifié' : 'à tige unique'}${stem[2] ? ', longues feuilles' : ''}`;
  }
  return VARIETY_LABELS[variety] ?? variety;
}

export function potLabel(genome: Genome): string {
  const color = POT_COLOR_LABELS[genome.potColor];
  if (genome.potShape === 'tray') return `plateau ${color}`;
  const pattern = POT_PATTERN_LABELS[genome.potPattern];
  return `pot ${POT_SHAPE_LABELS[genome.potShape]} ${color}${pattern ? ` ${pattern}` : ''}`;
}

export function speciesLabel(species: string): string {
  return SPECIES_LABELS[species as SpeciesId] ?? species;
}

/** One line for a plant: "Bonsaï Moyogi (sinueux) · vert forêt · panaché". */
export function describePlant(image: PlantImage): string {
  const variety = varietyLabel(image.variety);
  const trait = TRAIT_LABELS[image.genome.trait];
  return [
    `${speciesLabel(image.species)}${variety ? ` ${variety}` : ''}`,
    FOLIAGE_LABELS[image.genome.foliage],
    ...(trait ? [trait] : []),
  ].join(' · ');
}

export function isRare(image: PlantImage): boolean {
  return isRareTrait(image.genome.trait);
}
