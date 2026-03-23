import type { ReminderPriority } from '../types';

/** Single source of truth for the application name */
export const APP_NAME = 'What I Would Forget' as const;

export interface DefaultCategory {
  name: string;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { name: 'Bills', color: '#EF4444', icon: 'receipt' },
  { name: 'Health', color: '#10B981', icon: 'heart-pulse' },
  { name: 'Work', color: '#3B82F6', icon: 'briefcase' },
  { name: 'Personal', color: '#8B5CF6', icon: 'user' },
  { name: 'Home', color: '#F59E0B', icon: 'home' },
  { name: 'Shopping', color: '#EC4899', icon: 'shopping-cart' },
] as const;

/** Maximum number of reminders a single user can create */
export const MAX_REMINDERS_PER_USER = 500;

/** Maximum number of subtasks per reminder */
export const MAX_SUBTASKS_PER_REMINDER = 50;

/** Available snooze durations in minutes */
export const SNOOZE_OPTIONS = [5, 15, 30, 60] as const;

/** Maps each priority level to its notification behavior */
export const PRIORITY_LEVELS: Record<ReminderPriority, string> = {
  high: 'Prominent notification at scheduled time.',
  medium: 'Standard notification at scheduled time.',
  low: 'Quiet notification. Appears in notification center.',
  info: 'No notification. Visible in app only.',
} as const;
