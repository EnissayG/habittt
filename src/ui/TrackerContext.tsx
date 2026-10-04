import { createContext, useContext, type ReactNode } from 'react';

import type { HabitTracker } from '../domain';

// ui/ only knows the use cases' interface; App.tsx provides the real,
// SQLite-backed instance. This is how ui/ never imports data/.
const TrackerContext = createContext<HabitTracker | null>(null);

export function TrackerProvider({
  tracker,
  children,
}: {
  tracker: HabitTracker;
  children: ReactNode;
}) {
  return <TrackerContext.Provider value={tracker}>{children}</TrackerContext.Provider>;
}

export function useTracker(): HabitTracker {
  const tracker = useContext(TrackerContext);
  if (!tracker) throw new Error('useTracker must be used inside <TrackerProvider>');
  return tracker;
}
