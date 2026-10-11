import * as Haptics from 'expo-haptics';

import type { PulseStrength } from '../../domain';

// The meditation works eyes closed: the hand feels the breath (taps that
// come closer and stronger breathing in, that fade breathing out; see
// BREATH_PULSES), and a longer tap marks the end. A phone that cannot
// vibrate simply stays silent.

const STYLES: Record<PulseStrength, Haptics.ImpactFeedbackStyle> = {
  soft: Haptics.ImpactFeedbackStyle.Soft,
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
};

export function tapBreath(strength: PulseStrength): void {
  Haptics.impactAsync(STYLES[strength]).catch(() => undefined);
}

export function tapEnd(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
