import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ScheduleConfig,
  Subtask,
  CompletionRecord,
  ReminderStatus,
} from '@ohright/shared';
import { calculateNextOccurrence } from '@ohright/shared';
import { getDatabase, generateUUID } from '../lib/database';
import { emit, EVENTS } from '../lib/events';
import { scheduleNotification, cancelNotification } from './notifications.service';

interface ReminderRow {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  schedule_type: string;
  schedule_config: string;
  next_trigger_at: string | null;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SubtaskRow {
  id: string;
  reminder_id: string;
  title: string;
  is_completed: number;
  sort_order: number;
  created_at: string;
}

interface CompletionRow {
  id: string;
  reminder_id: string;
  scheduled_for: string;
  completed_at: string;
  action: string;
  subtask_snapshot: string;
}

function mapSubtaskRow(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    title: row.title,
    isCompleted: row.is_completed === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapCompletionRow(row: CompletionRow): CompletionRecord {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    scheduledFor: row.scheduled_for,
    completedAt: row.completed_at,
    action: row.action as CompletionRecord['action'],
    subtaskSnapshot: JSON.parse(row.subtask_snapshot) as Subtask[],
  };
}

function mapReminderRow(
  row: ReminderRow,
  subtasks: Subtask[] = [],
  completionHistory: CompletionRecord[] = [],
): Reminder {
  const schedule = JSON.parse(row.schedule_config) as ScheduleConfig;
  return {
    id: row.id,
    userId: '',
    categoryId: row.category_id ?? '',
    name: row.name,
    description: row.description ?? undefined,
    schedule,
    nextTriggerAt: row.next_trigger_at ?? '',
    status: row.status as ReminderStatus,
    priority: row.priority as Reminder['priority'],
    notes: row.notes ?? undefined,
    subtasks,
    completionHistory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ReminderFilters {
  status?: ReminderStatus;
  categoryId?: string;
  search?: string;
}

export async function getReminders(filters?: ReminderFilters): Promise<Reminder[]> {
  const db = await getDatabase();

  let query = 'SELECT * FROM reminders WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.categoryId) {
    query += ' AND category_id = ?';
    params.push(filters.categoryId);
  }

  if (filters?.search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += ' ORDER BY CASE WHEN next_trigger_at IS NULL THEN 1 ELSE 0 END, next_trigger_at ASC';

  const rows = await db.getAllAsync<ReminderRow>(query, params);

  const allSubtasks = await db.getAllAsync<SubtaskRow>(
    'SELECT * FROM subtasks ORDER BY sort_order ASC',
  );
  const allCompletions = await db.getAllAsync<CompletionRow>(
    'SELECT * FROM completion_records ORDER BY completed_at DESC',
  );

  const subtasksByReminder = new Map<string, SubtaskRow[]>();
  for (const s of allSubtasks) {
    const list = subtasksByReminder.get(s.reminder_id) ?? [];
    list.push(s);
    subtasksByReminder.set(s.reminder_id, list);
  }
  const completionsByReminder = new Map<string, CompletionRow[]>();
  for (const c of allCompletions) {
    const list = completionsByReminder.get(c.reminder_id) ?? [];
    list.push(c);
    completionsByReminder.set(c.reminder_id, list);
  }

  const reminders: Reminder[] = [];
  for (const row of rows) {
    const subtaskRows = subtasksByReminder.get(row.id) ?? [];
    const completionRows = completionsByReminder.get(row.id) ?? [];
    reminders.push(
      mapReminderRow(row, subtaskRows.map(mapSubtaskRow), completionRows.map(mapCompletionRow)),
    );
  }

  return reminders;
}

export async function getReminder(id: string): Promise<Reminder | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReminderRow>('SELECT * FROM reminders WHERE id = ?', [id]);
  if (rows.length === 0) return null;

  const row = rows[0]!;
  const subtaskRows = await db.getAllAsync<SubtaskRow>(
    'SELECT * FROM subtasks WHERE reminder_id = ? ORDER BY sort_order ASC',
    [row.id],
  );
  const completionRows = await db.getAllAsync<CompletionRow>(
    'SELECT * FROM completion_records WHERE reminder_id = ? ORDER BY completed_at DESC',
    [row.id],
  );

  return mapReminderRow(row, subtaskRows.map(mapSubtaskRow), completionRows.map(mapCompletionRow));
}

export async function createReminder(data: CreateReminderDto): Promise<Reminder> {
  const db = await getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  const schedule: ScheduleConfig = data.schedule;
  const nextOccurrence = calculateNextOccurrence(schedule);
  const nextTriggerAt = nextOccurrence ? nextOccurrence.toISOString() : null;

  await db.runAsync(
    `INSERT INTO reminders (id, name, description, category_id, schedule_type, schedule_config, next_trigger_at, status, priority, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.description ?? null,
      data.categoryId ?? null,
      schedule.type,
      JSON.stringify(schedule),
      nextTriggerAt,
      'active',
      data.priority ?? 'medium',
      data.notes ?? null,
      now,
      now,
    ],
  );

  if (data.subtasks && data.subtasks.length > 0) {
    for (let i = 0; i < data.subtasks.length; i++) {
      const sub = data.subtasks[i]!;
      await db.runAsync(
        'INSERT INTO subtasks (id, reminder_id, title, sort_order) VALUES (?, ?, ?, ?)',
        [generateUUID(), id, sub.title, i],
      );
    }
  }

  if (data.categoryId) {
    await db.runAsync('UPDATE categories SET usage_count = usage_count + 1 WHERE id = ?', [
      data.categoryId,
    ]);
  }

  const reminder = await getReminder(id);
  if (reminder && nextTriggerAt) {
    try {
      await scheduleNotification(reminder);
    } catch {
      // Notification scheduling may fail if permission not granted
    }
  }

  emit(EVENTS.REMINDERS_CHANGED);
  return reminder!;
}

export async function updateReminder(
  id: string,
  data: UpdateReminderDto,
): Promise<Reminder | null> {
  const db = await getDatabase();
  const existing = await getReminder(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updates: string[] = ['updated_at = ?'];
  const params: unknown[] = [now];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.categoryId !== undefined) {
    updates.push('category_id = ?');
    params.push(data.categoryId);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }
  if (data.priority !== undefined) {
    updates.push('priority = ?');
    params.push(data.priority);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    params.push(data.notes);
  }
  if (data.schedule !== undefined) {
    updates.push('schedule_type = ?');
    params.push(data.schedule.type);
    updates.push('schedule_config = ?');
    params.push(JSON.stringify(data.schedule));

    const nextOccurrence = calculateNextOccurrence(data.schedule);
    updates.push('next_trigger_at = ?');
    params.push(nextOccurrence ? nextOccurrence.toISOString() : null);
  }

  params.push(id);
  await db.runAsync(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`, params);

  try {
    await cancelNotification(id);
    const updated = await getReminder(id);
    if (updated && updated.nextTriggerAt && updated.status === 'active') {
      await scheduleNotification(updated);
    }
  } catch {
    // Notification may not be available
  }

  emit(EVENTS.REMINDERS_CHANGED);
  return getReminder(id);
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDatabase();
  try {
    await cancelNotification(id);
  } catch {
    // ignore
  }
  await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
  emit(EVENTS.REMINDERS_CHANGED);
}

export async function completeReminder(id: string): Promise<Reminder | null> {
  const db = await getDatabase();
  const existing = await getReminder(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO completion_records (id, reminder_id, scheduled_for, completed_at, action, subtask_snapshot)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      generateUUID(),
      id,
      existing.nextTriggerAt || now,
      now,
      'completed',
      JSON.stringify(existing.subtasks),
    ],
  );

  if (existing.schedule.type !== 'once') {
    const nextOccurrence = calculateNextOccurrence(existing.schedule, new Date());

    if (nextOccurrence) {
      await db.runAsync('UPDATE subtasks SET is_completed = 0 WHERE reminder_id = ?', [id]);
      await db.runAsync('UPDATE reminders SET next_trigger_at = ?, updated_at = ? WHERE id = ?', [
        nextOccurrence.toISOString(),
        now,
        id,
      ]);

      const updated = await getReminder(id);
      if (updated) {
        try {
          await cancelNotification(id);
          await scheduleNotification(updated);
        } catch {
          // ignore
        }
      }
    } else {
      await db.runAsync('UPDATE reminders SET status = ?, updated_at = ? WHERE id = ?', [
        'completed',
        now,
        id,
      ]);
      try {
        await cancelNotification(id);
      } catch {
        // ignore
      }
    }
  } else {
    await db.runAsync('UPDATE reminders SET status = ?, updated_at = ? WHERE id = ?', [
      'completed',
      now,
      id,
    ]);
    try {
      await cancelNotification(id);
    } catch {
      // ignore
    }
  }

  emit(EVENTS.REMINDERS_CHANGED);
  return getReminder(id);
}

export async function snoozeReminder(id: string, minutes: number): Promise<Reminder | null> {
  const db = await getDatabase();
  const now = new Date();
  const snoozedUntil = new Date(now.getTime() + minutes * 60 * 1000);

  await db.runAsync('UPDATE reminders SET next_trigger_at = ?, updated_at = ? WHERE id = ?', [
    snoozedUntil.toISOString(),
    now.toISOString(),
    id,
  ]);

  await db.runAsync(
    `INSERT INTO completion_records (id, reminder_id, scheduled_for, completed_at, action, subtask_snapshot)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateUUID(), id, now.toISOString(), now.toISOString(), 'snoozed', '[]'],
  );

  const updated = await getReminder(id);
  if (updated) {
    try {
      await cancelNotification(id);
      await scheduleNotification(updated);
    } catch {
      // ignore
    }
  }

  emit(EVENTS.REMINDERS_CHANGED);
  return updated;
}

export async function skipReminder(id: string): Promise<Reminder | null> {
  const db = await getDatabase();
  const existing = await getReminder(id);
  if (!existing) return null;

  const now = new Date();

  await db.runAsync(
    `INSERT INTO completion_records (id, reminder_id, scheduled_for, completed_at, action, subtask_snapshot)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      generateUUID(),
      id,
      existing.nextTriggerAt || now.toISOString(),
      now.toISOString(),
      'skipped',
      JSON.stringify(existing.subtasks),
    ],
  );

  if (existing.schedule.type !== 'once') {
    const nextOccurrence = calculateNextOccurrence(existing.schedule, now);
    if (nextOccurrence) {
      await db.runAsync('UPDATE reminders SET next_trigger_at = ?, updated_at = ? WHERE id = ?', [
        nextOccurrence.toISOString(),
        now.toISOString(),
        id,
      ]);
    } else {
      await db.runAsync('UPDATE reminders SET status = ?, updated_at = ? WHERE id = ?', [
        'completed',
        now.toISOString(),
        id,
      ]);
    }
  } else {
    await db.runAsync('UPDATE reminders SET status = ?, updated_at = ? WHERE id = ?', [
      'completed',
      now.toISOString(),
      id,
    ]);
  }

  try {
    await cancelNotification(id);
    const updated = await getReminder(id);
    if (updated && updated.nextTriggerAt && updated.status === 'active') {
      await scheduleNotification(updated);
    }
  } catch {
    // ignore
  }

  emit(EVENTS.REMINDERS_CHANGED);
  return getReminder(id);
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE subtasks SET is_completed = ? WHERE id = ?', [
    isCompleted ? 1 : 0,
    subtaskId,
  ]);
  emit(EVENTS.REMINDERS_CHANGED);
}
