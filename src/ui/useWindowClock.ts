import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

/** Frames per second of the window: one per beat of drawWindow. */
const FPS = 6;

/**
 * Animation time of the window, in seconds, advancing a few times per
 * second while `active` (the screen is shown), the app is in the
 * foreground and the phone's "reduce motion" setting is off. Otherwise it
 * stays still (0 with reduce motion).
 */
export function useWindowClock(active: boolean): number {
  const [t, setT] = useState(0);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      setForeground(state === 'active'),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const running = active && foreground && !reduceMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setT((value) => value + 1 / FPS), 1000 / FPS);
    return () => clearInterval(timer);
  }, [running]);

  return reduceMotion ? 0 : t;
}
