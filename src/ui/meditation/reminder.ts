import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// The meditation reminder (ADR 0022): a local notification, off by default,
// once a day at a chosen time, never a reproach. Its state is the schedule
// itself: the chosen time travels in the notification's data.

const REMINDER_ID = 'habittt-meditation-reminder';
const REMINDER_TEXT = 'Le soleil est là, si tu as envie de respirer un peu.';

/** The times one can choose, in the morning, at noon, after work and in the evening. */
export const MEDITATION_TIMES = [
  { hour: 7, minute: 30 },
  { hour: 12, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 21, minute: 30 },
] as const;

export type ReminderTime = { hour: number; minute: number };

export function timeLabel({ hour, minute }: ReminderTime): string {
  return minute === 0 ? `${hour} h` : `${hour} h ${String(minute).padStart(2, '0')}`;
}

/** The time of the reminder, or null when it is off. */
export async function meditationReminder(): Promise<ReminderTime | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const request = scheduled.find((r) => r.identifier === REMINDER_ID);
  if (!request) return null;
  const data = request.content.data as Partial<ReminderTime> | undefined;
  return typeof data?.hour === 'number' && typeof data?.minute === 'number'
    ? { hour: data.hour, minute: data.minute }
    : MEDITATION_TIMES[2];
}

/** Asks for the permission when needed; 'denied' leaves everything off. */
export async function setMeditationReminder(time: ReminderTime): Promise<'on' | 'denied'> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meditation', {
      name: 'Rappel de méditation',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return 'denied';
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'habittt', body: REMINDER_TEXT, data: { ...time } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: 'meditation',
      hour: time.hour,
      minute: time.minute,
    },
  });
  return 'on';
}

export async function clearMeditationReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}
