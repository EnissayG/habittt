import { SceneCanvas, type SceneImage, type SceneTone } from './sceneImage';

// The plaque under each plant (ADR 0023): a small board of dark wood, framed
// with metal, where its days and its name are written. The metal grows finer
// as the days of the current life go by: bronze, silver, gold, platinum,
// then opal. Now and then a glint crosses it, more often and brighter as the
// metal grows finer. A plant that did not hold keeps a tarnished plaque,
// still and quiet. A free place for a new habit has a plain wooden board.

export type PlaqueMetal = 'bronze' | 'silver' | 'gold' | 'platinum' | 'opal';
export type PlaqueTier = PlaqueMetal | 'tarnished' | 'wood';

/** The days from which each metal is reached, finest last. */
export const PLAQUE_METALS: readonly { metal: PlaqueMetal; from: number }[] = [
  { metal: 'bronze', from: 0 },
  { metal: 'silver', from: 30 },
  { metal: 'gold', from: 90 },
  { metal: 'platinum', from: 180 },
  { metal: 'opal', from: 365 },
];

/** The plaque of a plant: its metal by the days of its life; tarnished once it died. */
export function plaqueTier(days: number, dead: boolean): PlaqueTier {
  if (dead) return 'tarnished';
  let metal: PlaqueMetal = 'bronze';
  for (const step of PLAQUE_METALS) if (days >= step.from) metal = step.metal;
  return metal;
}

/** The tones of one metal: its face, its lit edge, its shaded edge. */
const METAL_TONES: Record<Exclude<PlaqueTier, 'wood'>, [SceneTone, SceneTone, SceneTone]> = {
  bronze: ['bronze', 'bronzeLight', 'bronzeShade'],
  silver: ['silver', 'silverLight', 'silverShade'],
  gold: ['gold', 'goldLight', 'goldShade'],
  platinum: ['platinum', 'platinumLight', 'platinumShade'],
  opal: ['opalA', 'opalB', 'opalC'],
  tarnished: ['patina', 'patinaLight', 'patinaShade'],
};

/** The smallest plaque that still shows its frame, its corners and its wood. */
export const PLAQUE_MIN = { width: 16, height: 11 } as const;
/** Cells of metal around the wood. */
const FRAME = 2;
/** Rows of the two short chains a plaque hangs from, under a shelf. */
export const PLAQUE_HOOK_ROWS = 3;
/** Length of a corner bracket's arms, on the wood. */
const bracketArm = (w: number, h: number) => Math.min(4, Math.floor(Math.min(w, h) / 4));

/** The board of a plaque inside its image: under its chains, if it has some. */
function board(width: number, height: number, hooks: boolean) {
  const w = Math.max(PLAQUE_MIN.width, Math.round(width));
  const h = Math.max(PLAQUE_MIN.height, Math.round(height));
  const top = hooks ? PLAQUE_HOOK_ROWS : 0;
  return { w, h, top, bh: h - top };
}

/** A rounded corner: the four outermost cells are left empty. */
const isCorner = (x: number, y: number, w: number, h: number) =>
  (x === 0 || x === w - 1) && (y === 0 || y === h - 1);

/**
 * The plaque at rest, `width` × `height` cells (ADR 0023). A board of dark
 * wood with rounded corners, sunk in its metal frame (shaded under the
 * metal at the top and the left, catching the light at the bottom and the
 * right); the frame lit along its top and left edges, shaded along the
 * others; an L-shaped bracket and a rivet in each corner. Under a shelf
 * (`hooks`), it hangs from two short chains of the same metal. The board of
 * a free place has no metal, and plain iron chains.
 */
export function drawPlaque(
  tier: PlaqueTier,
  width: number,
  height: number,
  hooks = false,
): SceneImage {
  const { w, h, top, bh } = board(width, height, hooks);
  const c = new SceneCanvas(w, h);
  const metal = tier === 'wood' ? null : METAL_TONES[tier];
  const put = (x: number, y: number, tone: SceneTone) => {
    if (!isCorner(x, y, w, bh)) c.fill(x, top + y, 1, 1, tone);
  };
  const rect = (x: number, y: number, rw: number, rh: number, tone: SceneTone) => {
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) put(xx, yy, tone);
  };

  // The chains: links of the metal (or of iron), one cell wide.
  if (hooks) {
    const [face, , shade] = metal ?? (['plaqueIron', 'plaqueIron', 'plaqueIronShade'] as const);
    for (const x of [Math.round(w * 0.18), w - 1 - Math.round(w * 0.18)]) {
      for (let y = 0; y < top; y++) c.fill(x, y, 1, 1, y % 2 === 0 ? face : shade);
    }
  }

  // The wood, its grain in short strokes.
  rect(0, 0, w, bh, 'plaqueWood');
  for (let y = 3; y < bh - 3; y += 2) {
    const from = 4 + ((y * 7) % 11);
    for (let x = from; x < w - 4; x += 9 + ((x + y) % 5)) {
      rect(x, y, 2 + ((x * 3 + y) % 3), 1, 'plaqueWoodGrain');
    }
  }
  if (!metal) {
    rect(0, 0, w, 1, 'plaqueWoodLight');
    rect(0, 0, 1, bh, 'plaqueWoodLight');
    rect(0, bh - 1, w, 1, 'plaqueWoodShade');
    rect(w - 1, 0, 1, bh, 'plaqueWoodShade');
    return c.toImage();
  }
  const [face, light, shade] = metal;
  // The wood sinks in the frame: shadow under the metal, light at the far edges.
  rect(FRAME, FRAME, w - 2 * FRAME, 1, 'plaqueWoodShade');
  rect(FRAME, FRAME, 1, bh - 2 * FRAME, 'plaqueWoodShade');
  rect(FRAME, bh - FRAME - 1, w - 2 * FRAME, 1, 'plaqueWoodLight');
  rect(w - FRAME - 1, FRAME, 1, bh - 2 * FRAME, 'plaqueWoodLight');
  // The frame: two cells of metal, its outer edge lit at the top and the
  // left, shaded at the bottom and the right.
  rect(0, 0, w, FRAME, face);
  rect(0, bh - FRAME, w, FRAME, face);
  rect(0, 0, FRAME, bh, face);
  rect(w - FRAME, 0, FRAME, bh, face);
  rect(0, 0, w, 1, light);
  rect(0, 0, 1, bh, light);
  rect(0, bh - 1, w, 1, shade);
  rect(w - 1, 0, 1, bh, shade);
  // A bracket in each corner, on the wood, and its rivet.
  const arm = bracketArm(w, bh);
  for (const [x, y, dx, dy] of [
    [FRAME, FRAME, 1, 1],
    [w - 1 - FRAME, FRAME, -1, 1],
    [FRAME, bh - 1 - FRAME, 1, -1],
    [w - 1 - FRAME, bh - 1 - FRAME, -1, -1],
  ] as const) {
    for (let i = 0; i < arm; i++) {
      put(x + dx * i, y, face);
      put(x, y + dy * i, face);
    }
    put(x, y, light);
  }
  return c.toImage();
}

/**
 * How each metal shines (ADR 0023): a finer metal shines more often, wider,
 * brighter and slower, but never much. Bronze only warms one rivet; silver
 * passes a thin cool line; gold a warm band with a white heart and a star;
 * platinum a wide white band, slower, with a star; opal a slow wave of its
 * colors.
 */
const STYLE: Record<
  PlaqueMetal,
  {
    /** Turns of its wall it lets pass between two glints (1: every turn). */
    skip: number;
    /** Seconds the glint takes to cross. */
    crossing: number;
    /** Width of the band, in cells; 0 for a single warm rivet. */
    band: number;
    /** The band's tones, edge to heart. */
    tones: readonly SceneTone[];
    star: boolean;
  }
> = {
  bronze: { skip: 3, crossing: 1.2, band: 0, tones: ['bronzeLight'], star: false },
  silver: { skip: 2, crossing: 1, band: 1, tones: ['silverLight'], star: false },
  gold: { skip: 1, crossing: 1.1, band: 2, tones: ['goldLight', 'metalShine'], star: true },
  platinum: {
    skip: 1,
    crossing: 1.5,
    band: 3,
    tones: ['platinumLight', 'metalShine', 'platinumLight'],
    star: true,
  },
  opal: {
    skip: 1,
    crossing: 1.8,
    band: 4,
    tones: ['opalA', 'opalB', 'opalC', 'opalB'],
    star: false,
  },
};

/** Seconds of one turn of a wall: at most one plaque shines in it. */
export const PLAQUE_TURN = 4;
/** A wall has at least this many turns per round, even with fewer plaques. */
const MIN_TURNS = 4;
/** One turn out of two stays quiet: a full wall glints at most every 8 seconds. */
const QUIET_TURNS = 2;

/** Where a plaque stands among the plaques of its wall, for their turns. */
export interface PlaqueTurn {
  index: number;
  count: number;
}

/**
 * Whether the plaque `turn.index` may shine at time t, and how far into its
 * glint: the plaques of a wall take turns, one turn of PLAQUE_TURN seconds
 * each, every other turn quiet, at least MIN_TURNS turns a round, so that
 * a wall never sparkles, however many habits it holds. A plaque also lets its metal skip rounds.
 */
export function glintAt(metal: PlaqueMetal, t: number, turn: PlaqueTurn): number | null {
  const turns = Math.max(MIN_TURNS, turn.count * QUIET_TURNS);
  const slot = Math.floor(Math.max(0, t) / PLAQUE_TURN);
  if (slot % turns !== turn.index * QUIET_TURNS) return null;
  if (Math.floor(slot / turns) % STYLE[metal].skip !== 0) return null;
  const within = Math.max(0, t) - slot * PLAQUE_TURN;
  // The glint starts a little into its turn: never right after the previous one.
  const start = 0.6;
  const progress = (within - start) / STYLE[metal].crossing;
  return progress >= 0 && progress < 1 ? progress : null;
}

/**
 * What moves on a plaque at time t, laid over drawPlaque: its glint, when it
 * is its turn (see glintAt and STYLE). Null when nothing moves: the plaque
 * need not be drawn again. Nothing ever moves on a tarnished plaque nor on
 * a plain board.
 */
export function plaqueShine(
  tier: PlaqueTier,
  width: number,
  height: number,
  t: number,
  turn: PlaqueTurn = { index: 0, count: 1 },
  hooks = false,
): SceneImage | null {
  if (tier === 'wood' || tier === 'tarnished') return null;
  const progress = glintAt(tier, t, turn);
  if (progress === null) return null;
  const style = STYLE[tier];
  const { w, h: imageHeight, top, bh: h } = board(width, height, hooks);
  const canvas = new SceneCanvas(w, imageHeight);
  const put = (x: number, y: number, tone: SceneTone) => {
    if (x >= 0 && x < w && y >= 0 && y < h && !isCorner(x, y, w, h)) {
      canvas.fill(x, top + y, 1, 1, tone);
    }
  };
  const arm = bracketArm(w, h);
  const onFrame = (x: number, y: number) => {
    const inner = x >= FRAME && x < w - FRAME && y >= FRAME && y < h - FRAME;
    if (!inner) return true;
    const edge = y === FRAME || y === h - 1 - FRAME;
    const side = x === FRAME || x === w - 1 - FRAME;
    const nearX = x < FRAME + arm || x > w - 1 - FRAME - arm;
    const nearY = y < FRAME + arm || y > h - 1 - FRAME - arm;
    return (edge && nearX) || (side && nearY);
  };

  if (style.band === 0) {
    // Bronze: the top left rivet warms, then cools.
    const glow = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    put(FRAME, FRAME, style.tones[0]!);
    if (glow > 0.5) {
      put(FRAME + 1, FRAME, style.tones[0]!);
      put(FRAME, FRAME + 1, style.tones[0]!);
    }
    return canvas.toImage();
  }

  // A diagonal band that crosses the frame from left to right.
  const at = progress * (w + h + style.band) - h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.floor(x - y * 0.6 - at);
      if (d < 0 || d >= style.band || !onFrame(x, y)) continue;
      const k = Math.min(
        style.tones.length - 1,
        Math.round((d / Math.max(1, style.band - 1)) * (style.tones.length - 1)),
      );
      put(x, y, style.tones[k]!);
    }
  }
  // Gold and platinum: a small star on the top right rivet as the band reaches it.
  if (style.star && progress > 0.55 && progress < 0.85) {
    const x = w - 1 - FRAME;
    const y = FRAME;
    put(x, y, 'metalShine');
    if (progress > 0.62 && progress < 0.78) {
      put(x - 1, y, 'metalShine');
      put(x + 1, y, 'metalShine');
      put(x, y - 1, 'metalShine');
      put(x, y + 1, 'metalShine');
    }
  }
  return canvas.toImage();
}
