import { sin } from '../plant/trig';
import { garlandBulbs, SMOKE_SIZE } from './drawCorner';
import { LANTERN_SIZE } from './drawDecor';
import { mirrorRows, REFLECTION } from './drawFloor';
import type { RoomImage, RoomPlan } from './roomPlan';
import { SceneCanvas, type SceneImage, type SceneTone } from './sceneImage';

// The room with the lights off (ADR 0020). The room goes dark, and what
// gives light shines through it: the bulbs of the string of lights, the
// paper lantern, the candle, the incense's ember, the window. Each one
// glows around itself, alive in its own way: the bulbs twinkle, each at its
// own pace, the lantern breathes slowly, the candle flickers, the ember
// glows and fades, the window lets the light of the hour in.
// Everything here is in cells of the room; the UI draws it.

export type LightKind = 'bulb' | 'lantern' | 'candle' | 'ember' | 'window';

export interface LightSource {
  kind: LightKind;
  /** Center of the glow, in cells of the room (may fall between two cells). */
  x: number;
  y: number;
  /** How far the glow reaches, in cells. */
  radius: number;
  /** Its own pace: two lights of the same kind never beat together. */
  phase: number;
}

/** The tones that give light: drawn at full brightness over the dark room. */
export const LIGHT_TONES: ReadonlySet<SceneTone> = new Set<SceneTone>([
  'bulb',
  'bulbGlow',
  'lampShade',
  'lampLight',
  'ember',
]);

const RADIUS: Record<LightKind, number> = {
  bulb: 6,
  lantern: 36,
  candle: 22,
  ember: 5,
  window: 70,
};

/** Where the ember is, from the top left of the smoke's image: just under its middle. */
const SMOKE_MIDDLE = Math.floor(SMOKE_SIZE.width / 2) + 0.5;
const SMOKE_BOTTOM = SMOKE_SIZE.height + 0.5;

/** The golden ratio's fraction: phases spread evenly, never repeating. */
const SPREAD = 0.618033988749895;
const phaseOf = (index: number) => (index * SPREAD) % 1;

/**
 * Every light of the room: the cells that stay bright when the room goes
 * dark (`lit`, the size of the room: found in the room and in the
 * wallpaper, which holds the string of lights), and the glows around the
 * sources.
 */
export function roomLights(
  plan: RoomPlan,
  room: RoomImage,
  wallpaper: SceneImage,
): { lit: SceneImage; sources: LightSource[] } {
  const lit = new SceneCanvas(plan.width, plan.height);
  const keep = (image: { width: number }, i: number, tone: SceneTone | null | undefined) => {
    if (tone && LIGHT_TONES.has(tone))
      lit.fill(i % image.width, Math.floor(i / image.width), 1, 1, tone);
  };
  // The wallpaper first: what hangs in the room is in front of it.
  wallpaper.pixels.forEach((pixel, i) => keep(wallpaper, i, pixel?.tone));
  room.pixels.forEach((source, i) =>
    keep(room, i, source?.kind === 'tone' ? source.tone : undefined),
  );

  const sources: LightSource[] = [];
  const add = (kind: LightKind, x: number, y: number) =>
    sources.push({ kind, x, y, radius: RADIUS[kind], phase: phaseOf(sources.length + 1) });
  for (const bulb of garlandBulbs(plan.width)) add('bulb', bulb.x + 0.5, bulb.y + 0.5);
  for (const wall of plan.walls) {
    for (const placed of wall.items) {
      const { content } = placed;
      if (content.kind === 'window') {
        add(
          'window',
          placed.x + content.image.width / 2,
          placed.y + (placed.rows.to - placed.rows.from) / 2,
        );
      } else if (content.kind === 'decor' && content.piece === 'lantern') {
        add(
          'lantern',
          placed.x + content.image.width / 2,
          placed.y + content.image.height - LANTERN_SIZE.height / 2,
        );
      }
    }
  }
  for (const decor of plan.animated) {
    // The flame's image is 3 cells wide; the smoke rises from the ember, at
    // the middle of its bottom edge (see cornerAnimations).
    if (decor.kind === 'flame') add('candle', decor.x + 1.5, decor.y + 2);
    else add('ember', decor.x + SMOKE_MIDDLE, decor.y + SMOKE_BOTTOM);
  }
  return { lit: lit.toImage(), sources };
}

/**
 * How bright a light is at time t, from 0 to 1: each kind is alive in its
 * own way, each source at its own pace (only +, -, * and trig.ts: the same
 * on every phone).
 */
export function lightLevel(source: LightSource, t: number): number {
  const p = source.phase * 2 * Math.PI;
  let level: number;
  switch (source.kind) {
    case 'bulb':
      // A slow twinkle, a little faster or slower for each bulb.
      level = 0.72 + 0.28 * sin(t * (1.2 + source.phase) + p);
      break;
    case 'lantern':
      // A slow breath of light through the paper.
      level = 0.88 + 0.12 * sin(t * 0.8 + p);
      break;
    case 'candle':
      // A flicker: two quick waves that never line up.
      level = 0.82 + 0.1 * sin(t * 9 + p) + 0.08 * sin(t * 14.3 + 2 * p);
      break;
    case 'ember':
      // It glows and fades as the incense breathes.
      level = 0.6 + 0.4 * sin(t * 1.6 + p);
      break;
    case 'window':
      level = 0.94 + 0.06 * sin(t * 0.35 + p);
      break;
  }
  return Math.min(1, Math.max(0, level));
}

/** A light seen in the polished floor: a cell of the floor image, and how much of it shows. */
export interface ReflectedCell {
  x: number;
  y: number;
  tone: SceneTone;
  alpha: number;
}

/** How much of a glow the floor gives back, at most (under the baseboard). */
const GLOW_REFLECTION = 0.5;

/**
 * The lights of the dark room, seen in the polished floor: each lit cell at
 * its mirrored place (exactly where the floor mirrors it, see mirrorRows),
 * fading towards the viewer like the rest of the reflection, and each glow
 * mirrored too, weaker (`strength`, 0 to 1, to multiply with its own). The
 * floor rows are those of the floor image.
 */
export function reflectLights(
  room: RoomImage,
  rows: number,
  lit: SceneImage,
  sources: readonly LightSource[],
): { cells: ReflectedCell[]; sources: (LightSource & { strength: number })[] } {
  const mirror = mirrorRows(room, rows);
  const cells: ReflectedCell[] = [];
  for (const { y, source, fade } of mirror) {
    for (let x = 0; x < lit.width; x++) {
      const tone = lit.pixels[source * lit.width + x]?.tone;
      if (tone) cells.push({ x, y, tone, alpha: REFLECTION.object * fade });
    }
  }
  const reflected: (LightSource & { strength: number })[] = [];
  for (const light of sources) {
    const row = mirror.find((m) => m.source === Math.floor(light.y));
    if (!row) continue;
    reflected.push({
      ...light,
      y: row.y + (1 - (light.y - Math.floor(light.y))),
      strength: GLOW_REFLECTION * row.fade,
    });
  }
  return { cells, sources: reflected };
}
