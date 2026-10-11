import * as Haptics from 'expo-haptics';

// The meditation works eyes closed: a light tap marks each breath in, a
// longer one the end. A phone that cannot vibrate simply stays silent.

export function tapBreathIn(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function tapEnd(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
