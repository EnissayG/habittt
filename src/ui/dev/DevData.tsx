import { createContext, useContext, type ReactNode } from 'react';

/** Which database the app shows (development only). */
export type DataSource = 'real' | 'demo';

export interface DevData {
  source: DataSource;
  /** Empties the demo database, fills it with demo habits and shows it. */
  fillDemo: () => Promise<void>;
  /** Back to the user's own data (never touched by the demo). */
  showRealData: () => void;
}

const DevDataContext = createContext<DevData | null>(null);

export function DevDataProvider({ value, children }: { value: DevData; children: ReactNode }) {
  return <DevDataContext.Provider value={value}>{children}</DevDataContext.Provider>;
}

/** null outside development. */
export function useDevData(): DevData | null {
  return useContext(DevDataContext);
}
