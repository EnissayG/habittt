import { mirrorRows, REFLECTION, type RoomImage, type RoomSource } from '../../domain';

// The reflection of the room as raw pixels, ready to become one image: the
// shelf draws it in a single call, instead of one shape per color (there
// would be thousands: every row has its own opacity).

export interface FloorMirror {
  /** Columns of the image: the room's. */
  width: number;
  /** Rows of the image: one per row of the floor image. */
  height: number;
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
  const { width } = room;
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
      const source = room.pixels[row * width + x] ?? null;
      const alpha = (source ? REFLECTION.object : REFLECTION.wall) * fade;
      const [r, g, b] = rgbOf(source);
      const o = (y * width + x) * 4;
      bytes[o] = Math.round(r * alpha);
      bytes[o + 1] = Math.round(g * alpha);
      bytes[o + 2] = Math.round(b * alpha);
      bytes[o + 3] = Math.round(255 * alpha);
    }
  }
  return { width, height: rows, bytes };
}
