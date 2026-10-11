import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// The gentle evening reminder (screen 11): a local notification, off by
// default, every day at 20:00, never a reproach. Local notifications work
// in Expo Go. Its state is the schedule itself: nothing else is stored.

const REMINDER_ID = 'habittt-evening-reminder';
export const REMINDER_TIME = { hour: 20, minute: 0 } as const;
const REMINDER_TEXT = 'Ta plante est là, si tu as envie de passer la voir.';

export async function isReminderOn(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((request) => request.identifier === REMINDER_ID);
}

/** Asks for the permission when needed; 'denied' leaves everything off. */
export async function turnReminderOn(): Promise<'on' | 'denied'> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminder', {
      name: 'Rappel du soir',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return 'denied';
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'habittt', body: REMINDER_TEXT },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: 'reminder',
      ...REMINDER_TIME,
    },
  });
  return 'on';
}

export async function turnReminderOff(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}
