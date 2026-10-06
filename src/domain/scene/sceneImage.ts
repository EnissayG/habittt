import type { Genome } from '../plant/genome';
import type { PlantPixel } from '../plant/grid';

// Pixel images for the room around the plants (window, floor). Like plants,
// they hold symbolic tones only; the UI theme gives the colors and does the
// blending.

export type WindowTone =
  | 'frameDark'
  | 'frame'
  | 'frameLight'
  | 'frameShade'
  | 'sky0'
  | 'sky1'
  | 'sky2'
  | 'sky3'
  | 'sun'
  | 'sunCore'
  | 'paleSun'
  | 'eveningSun'
  | 'moon'
  | 'star'
  | 'cloud'
  | 'cloudShade'
  | 'hillFar'
  | 'hillNear'
  | 'houseWall'
  | 'roof'
  | 'windowLit'
  | 'trunk'
  | 'treeDark'
  | 'treeLight'
  | 'snow'
  | 'curtain'
  | 'curtainLight'
  | 'curtainShade';

export type RoomTone =
  | 'wallLine'
  | 'baseboard'
  | 'plank0'
  | 'plank1'
  | 'plank2'
  | 'seam'
  | 'shelf'
  | 'shelfShade'
  /** The dotted pot that creates a habit. */
  | 'outline';

/** Tones only ever used as translucent layers. */
export type LightTone = 'glare' | 'shine' | 'shadow';

export type SceneTone = WindowTone | RoomTone | LightTone;

/** A translucent layer painted over a pixel (as with canvas globalAlpha). */
export interface SceneLayer {
  readonly alpha: number;
  readonly source:
    | { readonly kind: 'tone'; readonly tone: SceneTone }
    | { readonly kind: 'plant'; readonly pixel: PlantPixel; readonly genome: Genome };
}

export interface ScenePixel {
  /** Opaque base; null lets the wall behind show through. */
  readonly tone: SceneTone | null;
  /** Translucent layers, bottom to top. */
  readonly layers: readonly SceneLayer[];
}

export interface SceneImage {
  readonly width: number;
  readonly height: number;
  /** Row-major; null = nothing drawn (the wall shows). */
  readonly pixels: readonly (ScenePixel | null)[];
}

/** Mutable drawing surface used while building a scene. */
export class SceneCanvas {
  readonly pixels: (ScenePixel | null)[];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.pixels = new Array<ScenePixel | null>(width * height).fill(null);
  }

  /** Opaque rectangle: replaces whatever was there, layers included. */
  fill(x: number, y: number, w: number, h: number, tone: SceneTone): void {
    this.each(x, y, w, h, (i) => {
      this.pixels[i] = { tone, layers: [] };
    });
  }

  /** Translucent rectangle: adds a layer on top of each pixel. */
  blend(x: number, y: number, w: number, h: number, source: SceneLayer['source'], alpha: number) {
    this.each(x, y, w, h, (i) => {
      const below = this.pixels[i];
      this.pixels[i] = {
        tone: below?.tone ?? null,
        layers: [...(below?.layers ?? []), { alpha, source }],
      };
    });
  }

  toImage(): SceneImage {
    return { width: this.width, height: this.height, pixels: this.pixels };
  }

  private each(x: number, y: number, w: number, h: number, visit: (index: number) => void) {
    for (let py = Math.max(0, y); py < Math.min(this.height, y + h); py++) {
      for (let px = Math.max(0, x); px < Math.min(this.width, x + w); px++) {
        visit(py * this.width + px);
      }
    }
  }
}
