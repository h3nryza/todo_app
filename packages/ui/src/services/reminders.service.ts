import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ScheduleConfig,
  Subtask,
  CompletionRecord,
  ReminderStatus,
} from '@wiwf/shared';
import { calculateNextOccurrence } from '@wiwf/shared';
import { getDatabase } from '@/lib/database';
import { emit, EVENTS } from '@/lib/events';
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
  let paramIdx = 1;

  if (filters?.status) {
    query += ` AND status = $${paramIdx}`;
    params.push(filters.status);
    paramIdx++;
  }

  if (filters?.categoryId) {
    query += ` AND category_id = $${paramIdx}`;
    params.push(filters.categoryId);
    paramIdx++;
  }

  if (filters?.search) {
    query += ` AND (name LIKE $${paramIdx} OR description LIKE $${paramIdx})`;
    params.push(`%${filters.search}%`);
    paramIdx++;
  }

  query += ' ORDER BY CASE WHEN next_trigger_at IS NULL THEN 1 ELSE 0 END, next_trigger_at ASC';

  const rows = await db.select<ReminderRow[]>(query, params);

  // Batch-load all subtasks and completion records to avoid N+1 queries
  const allSubtasks = await db.select<SubtaskRow[]>(
    'SELECT * FROM subtasks ORDER BY sort_order ASC',
  );
  const allCompletions = await db.select<CompletionRow[]>(
    'SELECT * FROM completion_records ORDER BY completed_at DESC',
  );

  // Group by reminder_id for O(1) lookup
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
  const rows = await db.select<ReminderRow[]>('SELECT * FROM reminders WHERE id = $1', [id]);
  if (rows.length === 0) return null;

  const row = rows[0]!;
  const subtaskRows = await db.select<SubtaskRow[]>(
    'SELECT * FROM subtasks WHERE reminder_id = $1 ORDER BY sort_order ASC',
    [row.id],
  );
  const completionRows = await db.select<CompletionRow[]>(
    'SELECT * FROM completion_records WHERE reminder_id = $1 ORDER BY completed_at DESC',
    [row.id],
  );

  return mapReminderRow(row, subtaskRows.map(mapSubtaskRow), completionRows.map(mapCompletionRow));
}

export async function createReminder(data: CreateReminderDto): Promise<Reminder> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const schedule: ScheduleConfig = data.schedule;
  const nextOccurrence = calculateNextOccurrence(schedule);
  const nextTriggerAt = nextOccurrence ? nextOccurrence.toISOString() : null;

  await db.execute(
    `INSERT INTO reminders (id, name, description, category_id, schedule_type, schedule_config, next_trigger_at, status, priority, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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

  // Insert subtasks
  if (data.subtasks && data.subtasks.length > 0) {
    for (let i = 0; i < data.subtasks.length; i++) {
      const sub = data.subtasks[i]!;
      await db.execute(
        'INSERT INTO subtasks (id, reminder_id, title, sort_order) VALUES ($1, $2, $3, $4)',
        [crypto.randomUUID(), id, sub.title, i],
      );
    }
  }

  // Increment category usage count
  if (data.categoryId) {
    await db.execute('UPDATE categories SET usage_count = usage_count + 1 WHERE id = $1', [
      data.categoryId,
    ]);
  }

  // Schedule notification
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
  const updates: string[] = ['updated_at = $1'];
  const params: unknown[] = [now];
  let paramIdx = 2;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIdx}`);
    params.push(data.name);
    paramIdx++;
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIdx}`);
    params.push(data.description);
    paramIdx++;
  }
  if (data.categoryId !== undefined) {
    updates.push(`category_id = $${paramIdx}`);
    params.push(data.categoryId);
    paramIdx++;
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIdx}`);
    params.push(data.status);
    paramIdx++;
  }
  if (data.priority !== undefined) {
    updates.push(`priority = $${paramIdx}`);
    params.push(data.priority);
    paramIdx++;
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramIdx}`);
    params.push(data.notes);
    paramIdx++;
  }
  if (data.schedule !== undefined) {
    updates.push(`schedule_type = $${paramIdx}`);
    params.push(data.schedule.type);
    paramIdx++;
    updates.push(`schedule_config = $${paramIdx}`);
    params.push(JSON.stringify(data.schedule));
    paramIdx++;

    const nextOccurrence = calculateNextOccurrence(data.schedule);
    updates.push(`next_trigger_at = $${paramIdx}`);
    params.push(nextOccurrence ? nextOccurrence.toISOString() : null);
    paramIdx++;
  }

  params.push(id);
  await db.execute(`UPDATE reminders SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);

  // Reschedule notification
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
  await db.execute('DELETE FROM reminders WHERE id = $1', [id]);
  emit(EVENTS.REMINDERS_CHANGED);
}

export async function completeReminder(id: string): Promise<Reminder | null> {
  const db = await getDatabase();
  const existing = await getReminder(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  // Record completion
  await db.execute(
    `INSERT INTO completion_records (id, reminder_id, scheduled_for, completed_at, action, subtask_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      crypto.randomUUID(),
      id,
      existing.nextTriggerAt || now,
      now,
      'completed',
      JSON.stringify(existing.subtasks),
    ],
  );

  // Check if recurring
  if (existing.schedule.type !== 'once') {
    // Calculate next occurrence
    const nextOccurrence = calculateNextOccurrence(existing.schedule, new Date());

    if (nextOccurrence) {
      // Reset subtasks
      await db.execute('UPDATE subtasks SET is_completed = 0 WHERE reminder_id = $1', [id]);

      // Update next trigger
      await db.execute('UPDATE reminders SET next_trigger_at = $1, updated_at = $2 WHERE id = $3', [
        nextOccurrence.toISOString(),
        now,
        id,
      ]);

      // Schedule next notification
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
      // No more occurrences
      await db.execute('UPDATE reminders SET status = $1, updated_at = $2 WHERE id = $3', [
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
    // One-time reminder, mark as completed
    await db.execute('UPDATE reminders SET status = $1, updated_at = $2 WHERE id = $3', [
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

  await db.execute('UPDATE reminders SET next_trigger_at = $1, updated_at = $2 WHERE id = $3', [
    snoozedUntil.toISOString(),
    now.toISOString(),
    id,
  ]);

  // Record snooze
  await db.execute(
    `INSERT INTO completion_records (id, reminder_id, scheduled_for, completed_at, action, subtask_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [crypto.randomUUID(), id, now.toISOString(), now.toISOString(), 'snoozed', '[]'],
  );

  // Reschedule notification
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

  // Record skip
  await db.execute(
    `INSERT INTO completion_records (id, reminder_id, scheduled_for, completed_at, action, subtask_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      crypto.randomUUID(),
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
      await db.execute('UPDATE reminders SET next_trigger_at = $1, updated_at = $2 WHERE id = $3', [
        nextOccurrence.toISOString(),
        now.toISOString(),
        id,
      ]);
    } else {
      await db.execute('UPDATE reminders SET status = $1, updated_at = $2 WHERE id = $3', [
        'completed',
        now.toISOString(),
        id,
      ]);
    }
  } else {
    await db.execute('UPDATE reminders SET status = $1, updated_at = $2 WHERE id = $3', [
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
  await db.execute('UPDATE subtasks SET is_completed = $1 WHERE id = $2', [
    isCompleted ? 1 : 0,
    subtaskId,
  ]);
  emit(EVENTS.REMINDERS_CHANGED);
}
