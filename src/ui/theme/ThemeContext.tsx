import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { PALETTES, type Palette } from './tokens';

// The lights of the app (ADR 0020, 0021). The bulb of the room turns them
// off: the room goes dark, and so does every screen. Kept while the app is
// open, not saved.

interface Lights {
  off: boolean;
  toggle: () => void;
}

const LightsContext = createContext<Lights>({ off: false, toggle: () => undefined });

export function LightsProvider({ children }: { children: ReactNode }) {
  const [off, setOff] = useState(false);
  const value = useMemo(() => ({ off, toggle: () => setOff((was) => !was) }), [off]);
  return <LightsContext.Provider value={value}>{children}</LightsContext.Provider>;
}

export function useLights(): Lights {
  return useContext(LightsContext);
}

/** The colors of the moment: lit, or dark with the lights off. */
export function usePalette(): Palette {
  return useLights().off ? PALETTES.dark : PALETTES.light;
}

/**
 * Styles made from the colors of the moment, made again only when the
 * lights change: `make` is the screen's StyleSheet, written once for both.
 */
export function useThemedStyles<T>(make: (colors: Palette) => T): T {
  const palette = usePalette();
  return useMemo(() => make(palette), [make, palette]);
}
