import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useTracker } from '../TrackerContext';

import { PALETTES, type Palette } from './tokens';

// The lights of the app (ADR 0020, 0021). The bulb of the room turns them
// off: the room goes dark, and so does every screen. Kept from one opening
// to the next (the settings, ADR 0022).

interface Lights {
  off: boolean;
  toggle: () => void;
}

const LightsContext = createContext<Lights>({ off: false, toggle: () => undefined });

export function LightsProvider({ children }: { children: ReactNode }) {
  const tracker = useTracker();
  const [off, setOff] = useState(false);
  useEffect(() => {
    tracker.getSettings().then(
      (settings) => setOff(settings.lightsOff),
      () => undefined,
    );
  }, [tracker]);
  const value = useMemo(
    () => ({
      off,
      toggle: () => {
        const next = !off;
        setOff(next);
        // Saved quietly: if it fails, the lights still change for now.
        tracker.saveSetting('lightsOff', next).catch(() => undefined);
      },
    }),
    [off, tracker],
  );
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
