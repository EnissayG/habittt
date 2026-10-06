import type { ScenePixel, SceneTone, WindowView } from '../../domain';
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
  | 'windowLit';

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
  trunk: '#5B4636',
  snow: '#FFFFFF',
  curtain: solarized.base2,
  curtainLight: solarized.base3,
  curtainShade: '#D3CBB7',
  wallLine: '#D3CBB7',
  baseboard: '#A89F88',
  plank0: '#6B4423',
  plank1: '#74492A',
  plank2: '#633F20',
  seam: '#4A2E16',
  shelf: SCENERY.shelf,
  shelfShade: SCENERY.shelfShade,
  outline: colors.border,
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
