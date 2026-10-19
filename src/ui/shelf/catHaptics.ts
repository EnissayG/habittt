import * as Haptics from 'expo-haptics';

// What the hand feels of the cat (ADR 0028): a small tick when it is
// touched, and a soft purr, a light tap every little while, as long as it
// is petted. A phone that cannot vibrate simply stays silent.

/** Milliseconds between two taps of the purr. */
const PURR_EVERY = 120;

export function tickCat(): void {
  Haptics.selectionAsync().catch(() => undefined);
}

/** Starts purring; the function returned stops it. */
export function startPurr(): () => void {
  const timer = setInterval(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => undefined);
  }, PURR_EVERY);
  return () => clearInterval(timer);
}
