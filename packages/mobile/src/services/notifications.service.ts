import * as Notifications from 'expo-notifications';
import type { Reminder } from '@ohright/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function isPermissionGranted(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotification(reminder: Reminder): Promise<void> {
  if (!reminder.nextTriggerAt) return;

  const granted = await isPermissionGranted();
  if (!granted) return;

  const triggerTime = new Date(reminder.nextTriggerAt).getTime();
  const now = Date.now();
  const delaySeconds = Math.max(1, Math.floor((triggerTime - now) / 1000));

  if (triggerTime <= now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.name,
        body: reminder.description || `Reminder: ${reminder.name}`,
        data: { reminderId: reminder.id },
        sound: reminder.priority === 'high' || reminder.priority === 'medium',
      },
      trigger: null,
    });
    return;
  }

  await cancelNotification(reminder.id);

  await Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: {
      title: reminder.name,
      body: reminder.description || `Reminder: ${reminder.name}`,
      data: { reminderId: reminder.id },
      sound: reminder.priority === 'high' || reminder.priority === 'medium',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      repeats: false,
    },
  });
}

export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Notification may not exist
  }
}

export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  let granted = await isPermissionGranted();
  if (!granted) {
    granted = await requestPermission();
  }

  if (!granted) {
    return {
      success: false,
      message:
        'Notification permission denied. Please enable notifications in your device settings.',
    };
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Oh Right! — Test',
        body: 'Notifications are working! You should see this as a notification.',
        sound: true,
      },
      trigger: null,
    });
    return {
      success: true,
      message: 'Test notification sent! Check your notification tray.',
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to send notification: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
