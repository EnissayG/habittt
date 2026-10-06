import { useCallback, useMemo } from 'react';
import { PixelRatio } from 'react-native';

import { PixelCanvas } from '../plant/PixelCanvas';
import { pixelScale } from '../plant/pixelScale';
import { colors } from '../theme/tokens';

// Icons are drawn in pixels, never emoji (mockup's common rules). 7×7
// bitmaps from the mockup.
const ICONS = {
  back: ['0001000', '0011000', '0111000', '1111111', '0111000', '0011000', '0001000'],
  dots: ['0000000', '0000000', '0000000', '1101011', '1101011', '0000000', '0000000'],
  gear: ['0010100', '0111110', '1110111', '0100010', '1110111', '0111110', '0010100'],
  drop: ['0001000', '0001000', '0011100', '0111110', '0111110', '0111110', '0011100'],
  dice: ['0000000', '0100010', '0000000', '0001000', '0000000', '0100010', '0000000'],
} as const;

export type IconName = keyof typeof ICONS;

interface PixelIconProps {
  name: IconName;
  /** Box size in points; the icon uses the largest sharp scale that fits. */
  size?: number;
}

export function PixelIcon({ name, size = 14 }: PixelIconProps) {
  const grid = useMemo(() => {
    const rows = ICONS[name];
    return {
      width: 7,
      height: 7,
      pixels: rows.flatMap((row) => [...row].map((bit) => (bit === '1' ? true : null))),
    };
  }, [name]);
  const color = name === 'drop' ? colors.water : colors.text;
  const colorOf = useCallback(() => color, [color]);
  const { cellSize } = pixelScale(grid, { width: size, height: size }, PixelRatio.get());
  return <PixelCanvas grid={grid} colorOf={colorOf} cellSize={cellSize} />;
}
