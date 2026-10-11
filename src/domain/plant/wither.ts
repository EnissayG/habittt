import type { PlantPixel, PlantTone, Tone } from './grid';
import { fnv1a } from './random';
import { SHELF_ROWS } from './scenery';

// A plant whose life is over (ADR 0013), dried where it stands. The plant of
// its last day keeps its pot, its wood and its outline; what changes:
//
// 1. Every pixel of the plant, and the soil, is flagged `dry`: the theme
//    gives it the colors of straw and dead wood instead of its greens.
// 2. Its foliage gets ragged: about one pixel in three of the outline of its
//    leaves has fallen. Only the outline, so that no hole opens inside a
//    leaf; never the wood, so that the trunk and the branches stay whole; and
//    never a thin line (a vine, a blade), which would turn into dots.
// 3. A few leaves lie on the shelf, beside the pot.
//
// Everything is drawn from the plant's own salt: a dead plant looks the same
// on every phone and every day.

/** Share of the foliage's outline that has fallen, in percent. */
const FALLEN_PERCENT = 34;
/** Neighbours (out of 8) a pixel needs to be part of a leaf rather than of a line. */
const LEAF_NEIGHBOURS = 4;
/** Leaves lying on the shelf: how many are tried, and how far from the pot. */
const LITTER = { count: 5, reach: 9 } as const;

const SCENERY_TONES: ReadonlySet<Tone> = new Set<Tone>([
  'soil',
  'pot',
  'potShade',
  'potPattern',
  'potPatternShade',
  'shelf',
  'shelfShade',
]);
/** Wood and thorns hold: only what was green falls. */
const HOLDS: ReadonlySet<Tone> = new Set<Tone>(['bark', 'barkDark', 'spine']);
/** Tones of the leaves lying on the shelf, picked in turn. */
const LITTER_TONES: readonly PlantTone[] = ['leaf', 'leafLight', 'leafDark'];

export interface WitherParams {
  width: number;
  height: number;
  /** Row of the pot's rim (the soil line). */
  rimY: number;
  /** Column of the middle of the pot. */
  anchorX: number;
  /** Half-width of the pot at its widest. */
  potHalfWidth: number;
  /** The plant's own salt (see Genome). */
  salt: number;
}

const isPlant = (pixel: PlantPixel | null): pixel is PlantPixel =>
  pixel !== null && !SCENERY_TONES.has(pixel.tone);

/** The pixels of a living plant's last day, dried. Pure: returns a new array. */
export function wither(
  pixels: readonly (PlantPixel | null)[],
  { width, height, rimY, anchorX, potHalfWidth, salt }: WitherParams,
): (PlantPixel | null)[] {
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? null : (pixels[y * width + x] ?? null);
  const chance = (x: number, y: number, what: string) => fnv1a(`${what}:${x}:${y}:${salt}`) % 100;

  const dried = pixels.map((pixel, i): PlantPixel | null => {
    if (pixel === null) return null;
    if (pixel.tone === 'soil') return { ...pixel, dry: true };
    if (!isPlant(pixel)) return pixel;
    const x = i % width;
    const y = Math.floor(i / width);
    const onOutline = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
    let neighbours = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx !== 0 || dy !== 0) && isPlant(at(x + dx, y + dy))) neighbours++;
      }
    }
    const falls =
      onOutline &&
      neighbours >= LEAF_NEIGHBOURS &&
      !HOLDS.has(pixel.tone) &&
      chance(x, y, 'fall') < FALLEN_PERCENT;
    if (falls) return null;
    // A dried plant has no flower left: the flag of a watered day goes too.
    return { tone: pixel.tone, day: pixel.day, relapse: pixel.relapse, dry: true };
  });

  // The litter: only when something grew, on the row above the board, in the
  // free cells beside the pot.
  if (!pixels.some(isPlant)) return dried;
  const row = rimY + SHELF_ROWS[0] - 1;
  for (let i = 0; i < LITTER.count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = anchorX + side * (potHalfWidth + 2 + (chance(i, row, 'litter') % LITTER.reach));
    if (x < 0 || x >= width || row < 0 || row >= height) continue;
    if (dried[row * width + x] !== null || at(x, row + 1)?.tone !== 'shelf') continue;
    dried[row * width + x] = {
      tone: LITTER_TONES[i % LITTER_TONES.length]!,
      day: 1,
      relapse: false,
      dry: true,
    };
  }
  return dried;
}
