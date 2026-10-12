import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Beats per second: enough for the air around the sun and the word to fade smoothly. */
const BEATS = 20;

/**
 * Seconds spent in the session. They advance only while `running` and the
 * app is in the foreground: in the background the session pauses, and it
 * resumes where it was.
 */
export function useSessionClock(running: boolean): number {
  const [t, setT] = useState(0);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      setForeground(state === 'active'),
    );
    return () => subscription.remove();
  }, []);

  const ticking = running && foreground;
  useEffect(() => {
    if (!ticking) return;
    // Measured, not counted: a late beat does not slow the session down.
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - last) / 1000;
      last = now;
      setT((value) => value + elapsed);
    }, 1000 / BEATS);
    return () => clearInterval(timer);
  }, [ticking]);

  return t;
}
