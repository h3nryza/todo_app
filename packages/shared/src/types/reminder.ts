import type { Subtask, CreateSubtaskDto } from './subtask';
import type { CompletionRecord } from './completion';

export type ReminderPriority = 'high' | 'medium' | 'low' | 'info';

export type ReminderStatus = 'active' | 'paused' | 'completed' | 'archived';

export type ScheduleType =
  | 'once'
  | 'hourly'
  | 'twice_daily'
  | 'daily'
  | 'weekly'
  | 'monthly_date'
  | 'monthly_weekday'
  | 'yearly'
  | 'cron';

export interface ScheduleConfig {
  type: ScheduleType;
  /** Repeat interval (e.g., every 2 hours, every 3 days) */
  interval?: number;
  /** Days of the week (0 = Sunday through 6 = Saturday) for weekly schedules */
  daysOfWeek?: number[];
  /** Day of the month (1-31) for monthly_date schedules */
  dayOfMonth?: number;
  /** Week of the month (1-5) for monthly_weekday schedules */
  weekOfMonth?: number;
  /** Cron expression for cron schedules */
  cronExpression?: string;
  /** Schedule start date (ISO 8601) */
  startDate: string;
  /** Optional schedule end date (ISO 8601) */
  endDate?: string;
  /** Time of day in HH:mm format */
  timeOfDay: string;
  /** Second time of day in HH:mm format (used for twice_daily schedules) */
  secondTimeOfDay?: string;
  /** IANA timezone identifier */
  timezone: string;
}

export interface Reminder {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  nextTriggerAt: string;
  status: ReminderStatus;
  priority: ReminderPriority;
  notes?: string;
  subtasks: Subtask[];
  completionHistory: CompletionRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDto {
  categoryId?: string;
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  priority?: ReminderPriority;
  notes?: string;
  subtasks?: CreateSubtaskDto[];
}

export interface UpdateReminderDto {
  categoryId?: string;
  name?: string;
  description?: string | null;
  schedule?: ScheduleConfig;
  status?: ReminderStatus;
  priority?: ReminderPriority;
  notes?: string | null;
}
