import { createContext, useContext, type ReactNode } from 'react';

import { useWindowClock } from '../useWindowClock';

const SceneTime = createContext(0);

/**
 * One clock for everything that moves in the room (the window, the
 * reflection in the floor): the walls share the same instant, so the wave
 * of the floor runs unbroken from one wall to the next. Only the components
 * that read the time redraw when it advances.
 */
export function SceneClock({ active, children }: { active: boolean; children: ReactNode }) {
  const t = useWindowClock(active);
  return <SceneTime.Provider value={t}>{children}</SceneTime.Provider>;
}

/** Animation time of the room, in seconds (0 outside a SceneClock). */
export function useSceneTime(): number {
  return useContext(SceneTime);
}
