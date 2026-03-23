/**
 * Notification service for What I Would Forget.
 *
 * Uses a dual approach:
 * 1. Try @tauri-apps/plugin-notification (native OS notifications)
 * 2. Fall back to Web Notification API (works in Tauri's WebView on all platforms)
 *
 * macOS: System Settings → Notifications → What I Would Forget → Allow Notifications
 * Windows: Settings → System → Notifications → What I Would Forget
 * Linux: Requires libnotify
 */
import {
  isPermissionGranted as tauriCheckPermission,
  requestPermission as tauriRequestPermission,
  sendNotification as tauriSendNotification,
} from '@tauri-apps/plugin-notification';
import type { Reminder } from '@wiwf/shared';

const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Check notification permission. Tries Tauri plugin first, then Web API.
 */
export async function isPermissionGranted(): Promise<boolean> {
  // Try Tauri plugin
  try {
    const granted = await tauriCheckPermission();
    if (granted) return true;
  } catch {
    // Plugin unavailable
  }

  // Check Web Notification API
  if (typeof Notification !== 'undefined') {
    return Notification.permission === 'granted';
  }

  return false;
}

/**
 * Request notification permission from the OS.
 */
export async function requestPermission(): Promise<boolean> {
  // Try Tauri plugin first
  try {
    const result = await tauriRequestPermission();
    if (result === 'granted') return true;
  } catch {
    // Plugin unavailable
  }

  // Fall back to Web Notification API
  if (typeof Notification !== 'undefined') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  return false;
}

/**
 * Send a notification using the best available method.
 * Tries Tauri native first, falls back to Web Notification API.
 */
function fireNotification(title: string, body: string): boolean {
  // Try Tauri native notification
  try {
    tauriSendNotification({ title, body });
    console.log('[Notifications] Sent via Tauri plugin:', title);
    return true;
  } catch (err) {
    console.warn('[Notifications] Tauri plugin failed:', err);
  }

  // Fall back to Web Notification API
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon: '/icons/icon.png',
        requireInteraction: true,
      });
      console.log('[Notifications] Sent via Web API:', title);
      // Auto-close after 10 seconds
      setTimeout(() => n.close(), 10000);
      return true;
    } catch (err) {
      console.warn('[Notifications] Web API failed:', err);
    }
  }

  console.error('[Notifications] All methods failed for:', title);
  return false;
}

export async function scheduleNotification(reminder: Reminder): Promise<void> {
  if (!reminder.nextTriggerAt) return;

  const granted = await isPermissionGranted();
  if (!granted) return;

  const triggerTime = new Date(reminder.nextTriggerAt).getTime();
  const now = Date.now();
  const delay = triggerTime - now;

  if (delay <= 0) {
    fireNotification(reminder.name, reminder.description || `Reminder: ${reminder.name}`);
    return;
  }

  cancelNotification(reminder.id);

  const timeout = setTimeout(
    () => {
      fireNotification(reminder.name, reminder.description || `Reminder: ${reminder.name}`);
      scheduledTimeouts.delete(reminder.id);
    },
    Math.min(delay, 2147483647),
  );

  scheduledTimeouts.set(reminder.id, timeout);
}

export async function cancelNotification(id: string): Promise<void> {
  const existing = scheduledTimeouts.get(id);
  if (existing) {
    clearTimeout(existing);
    scheduledTimeouts.delete(id);
  }
}

/**
 * Send a test notification. Returns detailed result for the UI.
 */
export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  // Ensure permission
  let granted = await isPermissionGranted();
  if (!granted) {
    granted = await requestPermission();
  }

  if (!granted) {
    const platform = navigator.platform.toLowerCase();
    let guide: string;
    if (platform.includes('mac')) {
      guide =
        'macOS: Open System Settings → Notifications → What I Would Forget → turn on "Allow Notifications". Set alert style to Alerts or Banners. Enable Sound and Badge. Ensure Focus/Do Not Disturb is OFF.';
    } else if (platform.includes('win')) {
      guide = 'Windows: Settings → System → Notifications → What I Would Forget → ON';
    } else {
      guide = 'Check your system notification settings and ensure What I Would Forget is allowed.';
    }
    return { success: false, message: `Permission denied. ${guide}` };
  }

  const sent = fireNotification(
    'What I Would Forget — Test',
    'Notifications are working! You should see this as a system notification.',
  );

  if (sent) {
    return {
      success: true,
      message: 'Test notification sent! Check your notification center / banner area.',
    };
  }

  return {
    success: false,
    message:
      'Notification API call succeeded but no notification appeared. On macOS, check System Settings → Notifications → What I Would Forget and ensure Alerts/Banners are enabled (not "None"). Also ensure Focus mode is off.',
  };
}
