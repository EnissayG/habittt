import type { LightKind, RoomSource, ScenePixel, SceneTone, WindowView } from '../../domain';
import { plantColor, SCENERY } from './plantPalette';
import { colors, solarized } from './tokens';

// Real colors of the window and the floor, per view, from the mockup's
// VIEWS table. Translucent layers are blended like a canvas with
// globalAlpha: each channel rounded to 8 bits after every layer.

type ViewTone =
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'hillFar'
  | 'hillNear'
  | 'treeDark'
  | 'treeLight'
  | 'cloud'
  | 'cloudShade'
  | 'houseWall'
  | 'roof'
  | 'windowLit'
  | 'smoke';

const BY_VIEW: Record<WindowView, Record<ViewTone, string>> = {
  day: {
    sky0: '#6FB7D6',
    sky1: '#8CCBE2',
    sky2: '#A8D8E8',
    sky3: '#CDEAF0',
    hillFar: '#9DB36A',
    hillNear: solarized.green,
    treeDark: '#5F7000',
    treeLight: solarized.green,
    cloud: '#FFFFFF',
    cloudShade: '#D6EEF3',
    houseWall: solarized.base2,
    roof: solarized.orange,
    windowLit: solarized.base1,
    smoke: '#FFFFFF',
  },
  evening: {
    sky0: '#5B4B8A',
    sky1: '#B0567A',
    sky2: '#E77C5A',
    sky3: '#F6B26B',
    hillFar: '#7A5C6E',
    hillNear: '#46580A',
    treeDark: '#2E3A06',
    treeLight: '#46580A',
    cloud: '#F9C9A0',
    cloudShade: '#D98A8A',
    houseWall: '#C9A58E',
    roof: '#8A3210',
    windowLit: '#F2C94C',
    smoke: '#F9C9A0',
  },
  night: {
    sky0: '#04222B',
    sky1: solarized.base02,
    sky2: '#0B3F4D',
    sky3: '#14505F',
    hillFar: '#0E4753',
    hillNear: '#0A3440',
    treeDark: '#052830',
    treeLight: '#0A3440',
    cloud: '#124B59',
    cloudShade: '#0E4753',
    houseWall: '#124B59',
    roof: '#0A3440',
    windowLit: '#F2C94C',
    smoke: '#3A6F7D',
  },
  winter: {
    sky0: '#AEBFC6',
    sky1: '#C3D0D5',
    sky2: '#D8E1E4',
    sky3: '#EDF1F2',
    hillFar: '#E2E8EA',
    hillNear: solarized.base3,
    treeDark: '#5B4636',
    treeLight: '#FFFFFF',
    cloud: '#FFFFFF',
    cloudShade: '#E2E8EA',
    houseWall: solarized.base2,
    roof: '#FFFFFF',
    windowLit: '#F2C94C',
    smoke: '#FFFFFF',
  },
};

const FIXED: Record<Exclude<SceneTone, ViewTone>, string> = {
  frameDark: '#5B4636',
  frame: solarized.yellow,
  frameLight: '#D9B44A',
  frameShade: '#93710A',
  sun: '#F7D774',
  sunCore: '#FFF3B0',
  paleSun: '#F4F4EC',
  eveningSun: '#FFD98A',
  moon: solarized.base2,
  star: solarized.base2,
  starBright: '#FFFFFF',
  starDim: '#B8C4C4',
  starFaint: '#6E8B94',
  starGlow: '#7FA6B0',
  windowGlow: '#FDE9A8',
  trunk: '#5B4636',
  snow: '#FFFFFF',
  curtain: solarized.base2,
  curtainLight: solarized.base3,
  curtainShade: '#D3CBB7',
  wall: colors.background,
  wallLine: '#D3CBB7',
  baseboard: '#A89F88',
  plank0: '#6B4423',
  plank1: '#74492A',
  plank2: '#633F20',
  seam: '#4A2E16',
  shelf: SCENERY.shelf,
  shelfShade: SCENERY.shelfShade,
  outline: colors.border,
  lampShade: '#F2C94C',
  lampLight: '#FDE9A8',
  paintDawn0: '#CFE3E6',
  paintDawn1: '#F3E3C3',
  paintDawn2: '#F8CFA6',
  paintRidge0: '#B4C8C4',
  paintRidge1: '#86A6A0',
  paintRidge2: '#4F7F7B',
  paintRidge3: '#1F5552',
  paintPine: solarized.base02,
  paintDusk0: '#5B4B8A',
  paintDusk1: '#8E5285',
  paintDusk2: '#B0567A',
  paintDusk3: '#E77C5A',
  paintDusk4: '#F6B26B',
  paintCloud: '#F9C9A0',
  paintSea0: '#3F5F8C',
  paintSea1: '#2F4A73',
  paintSea2: '#22375A',
  paintGlint: '#F6B26B',
  paintGlintDeep: '#C9785F',
  paintLand: '#1B2A44',
  paintSail: solarized.base3,
  paintPaper: solarized.base2,
  paintDisc: '#E9BE5A',
  paintInk: solarized.base1,
  paintPot: solarized.blue,
  paintPotLight: '#5AAAE0',
  paintPotShade: '#1E6FA8',
  paintBark: '#7A5230',
  paintLeaf: solarized.green,
  paintLeafLight: '#A8BD2A',
  paintLeafDark: '#5F7000',
  paintSeal: solarized.magenta,
  tableTop: '#8A5A32',
  tableLight: '#A9743F',
  tableShade: '#6B4423',
  stone: '#A9A49A',
  stoneLight: '#C8C3B8',
  stoneShade: '#86817A',
  wax: '#F6F0DE',
  waxShade: '#DDD5BD',
  ember: '#E07B39',
  incense: '#D8D0BA',
  paperShade: '#DDD6C0',
  ink: solarized.base01,
  inkDeep: solarized.base02,
  cushion: '#5D6AB8',
  cushionLight: '#7C88CC',
  cushionShade: '#474F8E',
  mat: '#CDB687',
  matDark: '#B09867',
  incenseFaint: '#E8E1CE',
  bookA: solarized.cyan,
  bookB: '#B58900',
  bookC: solarized.violet,
  bookShade: '#586E75',
  brass: '#C9A23A',
  brassLight: '#E3C463',
  brassShade: '#9C7A20',
  vase: '#8FA3A6',
  vaseLight: '#AFC0C2',
  vaseShade: '#6F8487',
  grass: '#B9A270',
  grassPlume: '#E3D3A6',
  wallpaper: '#F3EAD2',
  moulding: '#EEE6CF',
  mouldingShade: '#E0D6BC',
  garland: '#8C9A98',
  bulb: '#F2C94C',
  bulbGlow: '#F9E7A8',
  sunHeart: '#F5CF5A',
  sunGlow: '#F6D77E',
  airA: '#F7DE97',
  airB: '#F9E7B2',
  airC: '#FAEDC8',
  glare: '#FFFFFF',
  shine: '#FFFFFF',
  shadow: solarized.base02,
};

function toneColor(tone: SceneTone, view: WindowView): string {
  return tone in BY_VIEW.day ? BY_VIEW[view][tone as ViewTone] : FIXED[tone as keyof typeof FIXED];
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function hex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Final color of a window or floor pixel. */
export function sceneColor(pixel: ScenePixel, view: WindowView): string {
  let color = rgb(pixel.tone ? toneColor(pixel.tone, view) : colors.background);
  for (const { alpha, source } of pixel.layers) {
    const top = rgb(
      source.kind === 'tone'
        ? toneColor(source.tone, view)
        : plantColor(source.pixel, source.genome),
    );
    color = color.map((c, i) => Math.round(top[i]! * alpha + c * (1 - alpha))) as typeof color;
  }
  return hex(color);
}

/** Color of what the floor mirrors at one cell of the room; the bare wall when nothing is there. */
export function roomColor(source: RoomSource | null, view: WindowView): string {
  if (!source) return colors.background.toUpperCase();
  return source.kind === 'tone'
    ? toneColor(source.tone, view).toUpperCase()
    : plantColor(source.pixel, source.genome).toUpperCase();
}

/** The glow around each light of the dark room (ADR 0020): warm, but the window's follows the hour. */
const GLOW: Record<Exclude<LightKind, 'window'>, string> = {
  bulb: '#FFD978',
  lantern: '#FFCF7A',
  candle: '#FFB24C',
  ember: '#FF7A3A',
};
const WINDOW_GLOW: Record<WindowView, string> = {
  day: '#CDEAF0',
  evening: '#F6B26B',
  night: '#3A6F9D',
  winter: '#EDF1F2',
};
/** How strong each glow is at its center, at full brightness. */
const GLOW_STRENGTH: Record<LightKind, number> = {
  bulb: 0.55,
  lantern: 0.4,
  candle: 0.45,
  ember: 0.6,
  window: 0.4,
};

export function glowColor(kind: LightKind, view: WindowView): string {
  return kind === 'window' ? WINDOW_GLOW[view] : GLOW[kind];
}

export function glowStrength(kind: LightKind, view: WindowView): number {
  // At night the window lets in only a little moonlight; in the evening, some.
  if (kind === 'window' && view === 'night') return 0.14;
  if (kind === 'window' && view === 'evening') return 0.3;
  return GLOW_STRENGTH[kind];
}

/** How the room looks with the lights off, at this hour (ADR 0020). */
export interface LightsOffLook {
  /** Laid over the whole room, and over the window. */
  veil: string;
  windowVeil: string;
  /** Text over the dark room: the numbers, and what is quieter. */
  text: string;
  muted: string;
  statusBar: 'light' | 'dark';
}

/**
 * Lights off in the daytime, the daylight still fills the room: it only
 * dims, and the text stays dark. In the evening it is dusky; at night it is
 * dark, and only the lights shine. Each pair of text and wall is checked in
 * contrast.test.ts (TEXT_PAIRS).
 */
export function lightsOffLook(view: WindowView): LightsOffLook {
  switch (view) {
    case 'day':
    case 'winter':
      return {
        veil: colors.darknessDay,
        windowVeil: colors.windowDarknessDay,
        text: colors.text,
        muted: colors.text,
        statusBar: 'dark',
      };
    case 'evening':
      return {
        veil: colors.darknessEvening,
        windowVeil: colors.windowDarknessEvening,
        text: colors.textInDark,
        muted: colors.textInDark,
        statusBar: 'light',
      };
    case 'night':
      return {
        veil: colors.darkness,
        windowVeil: colors.windowDarkness,
        text: colors.textInDark,
        muted: colors.mutedInDark,
        statusBar: 'light',
      };
  }
}

/** How much of the sun's glow each ring of air keeps, from the heart outwards. */
const AIR_SHARE = { sunGlow: 1, airA: 0.72, airB: 0.48, airC: 0.28 } as const;

/**
 * The sun of the meditation on a dark screen (ADR 0021): the rings of air
 * fade from the sun's glow into the background, as they fade into the cream
 * wall in the light. Everything else keeps its day color.
 */
export function sunOnDark(background: string): (pixel: ScenePixel) => string {
  const glow = rgb(FIXED.sunGlow);
  const back = rgb(background);
  return (pixel) => {
    const tone = pixel.tone;
    if (tone && tone in AIR_SHARE) {
      const k = AIR_SHARE[tone as keyof typeof AIR_SHARE];
      return hex(glow.map((c, i) => Math.round(c * k + back[i]! * (1 - k))) as typeof glow);
    }
    return sceneColor(pixel, 'day');
  };
}
