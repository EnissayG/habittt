import {
  mirrorRows,
  REFLECTION,
  REFLECTION_MAX_SHIFT,
  type RoomImage,
  type RoomSource,
} from '../../domain';

// The reflection of the room as raw pixels, ready to become one image: the
// shelf then slides its rows sideways a few times per second (the wave)
// without computing a single color again.

export interface FloorMirror {
  /** Columns of the image: the room's, plus `pad` on each side. */
  width: number;
  /** Rows of the image: one per row of the floor image. */
  height: number;
  /**
   * Columns added on each side, repeating the room's edge: a shifted row
   * never shows a gap at the ends of the room.
   */
  pad: number;
  /** RGBA, 8 bits per channel, premultiplied by alpha, row-major. */
  bytes: Uint8Array;
}

/**
 * Mirrors the room into the floor's rows (see mirrorRows): each pixel has
 * the color of what it reflects and the opacity of its row, lower for the
 * bare wall. Rows that reflect nothing stay transparent.
 */
export function floorMirror(
  room: RoomImage,
  rows: number,
  colorOf: (source: RoomSource | null) => string,
): FloorMirror {
  const pad = REFLECTION_MAX_SHIFT;
  const width = room.width + pad * 2;
  const bytes = new Uint8Array(width * rows * 4);
  // A room holds few distinct sources: each color is read once.
  const colors = new Map<RoomSource | null, readonly [number, number, number]>();
  const rgbOf = (source: RoomSource | null) => {
    let rgb = colors.get(source);
    if (!rgb) {
      const hex = colorOf(source);
      rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
      colors.set(source, rgb);
    }
    return rgb;
  };

  for (const { y, source: row, fade } of mirrorRows(room, rows)) {
    for (let x = 0; x < width; x++) {
      const sx = Math.min(room.width - 1, Math.max(0, x - pad));
      const source = room.pixels[row * room.width + sx] ?? null;
      const alpha = (source ? REFLECTION.object : REFLECTION.wall) * fade;
      const [r, g, b] = rgbOf(source);
      const o = (y * width + x) * 4;
      bytes[o] = Math.round(r * alpha);
      bytes[o + 1] = Math.round(g * alpha);
      bytes[o + 2] = Math.round(b * alpha);
      bytes[o + 3] = Math.round(255 * alpha);
    }
  }
  return { width, height: rows, pad, bytes };
}

/** Rows [from, to) of the floor that share one shift. */
export interface ShiftBand {
  from: number;
  to: number;
  shift: number;
}

/** The wave at time t, as bands of neighbouring rows shifted alike: one draw each. */
export function shiftBands(room: RoomImage, rows: number, t: number): ShiftBand[] {
  const bands: ShiftBand[] = [];
  for (const { y, shift } of mirrorRows(room, rows, t)) {
    const last = bands[bands.length - 1];
    if (last && last.shift === shift && last.to === y) last.to = y + 1;
    else bands.push({ from: y, to: y + 1, shift });
  }
  return bands;
}
