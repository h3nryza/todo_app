import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { getDatabase } from '@/lib/database';
import { emit, EVENTS } from '@/lib/events';

interface ExportData {
  version: string;
  exportedAt: string;
  settings: Record<string, unknown>;
  categories: Array<Record<string, unknown>>;
  reminders: Array<Record<string, unknown>>;
}

export async function exportData(): Promise<boolean> {
  try {
    const db = await getDatabase();

    const users = await db.select<Array<Record<string, unknown>>>('SELECT * FROM users LIMIT 1');
    const categories = await db.select<Array<Record<string, unknown>>>('SELECT * FROM categories');
    const reminders = await db.select<Array<Record<string, unknown>>>('SELECT * FROM reminders');
    const subtasks = await db.select<Array<Record<string, unknown>>>('SELECT * FROM subtasks');
    const completions = await db.select<Array<Record<string, unknown>>>(
      'SELECT * FROM completion_records',
    );

    // Attach subtasks and completions to their reminders
    const remindersWithRelations = reminders.map((r) => ({
      ...r,
      subtasks: subtasks.filter((s) => s['reminder_id'] === r['id']),
      completionRecords: completions.filter((c) => c['reminder_id'] === r['id']),
    }));

    const exportPayload: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: users[0] ?? {},
      categories,
      reminders: remindersWithRelations,
    };

    const filePath = await save({
      title: 'Export WIWF Data',
      defaultPath: `wiwf-export-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!filePath) return false;

    await writeTextFile(filePath, JSON.stringify(exportPayload, null, 2));
    return true;
  } catch (err) {
    console.error('Export failed:', err);
    return false;
  }
}

export async function importData(): Promise<boolean> {
  try {
    const filePath = await open({
      title: 'Import WIWF Data',
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!filePath) return false;

    const filePathStr =
      typeof filePath === 'string' ? filePath : (filePath as unknown as { path: string }).path;
    const content = await readTextFile(filePathStr);
    const data = JSON.parse(content) as ExportData;

    if (!data.version || !data.categories || !data.reminders) {
      throw new Error('Invalid export file format');
    }

    const db = await getDatabase();

    // Import categories (upsert)
    for (const cat of data.categories) {
      const existing = await db.select<Array<{ id: string }>>(
        'SELECT id FROM categories WHERE id = $1',
        [cat['id'] as string],
      );
      if (existing.length > 0) {
        await db.execute(
          'UPDATE categories SET name = $1, color = $2, icon = $3, is_favorite = $4 WHERE id = $5',
          [cat['name'], cat['color'], cat['icon'], cat['is_favorite'], cat['id']],
        );
      } else {
        await db.execute(
          'INSERT INTO categories (id, name, color, icon, is_favorite, usage_count, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            cat['id'],
            cat['name'],
            cat['color'],
            cat['icon'],
            cat['is_favorite'] ?? 0,
            cat['usage_count'] ?? 0,
            cat['created_at'] ?? new Date().toISOString(),
          ],
        );
      }
    }

    // Import reminders (upsert)
    for (const rem of data.reminders) {
      const existing = await db.select<Array<{ id: string }>>(
        'SELECT id FROM reminders WHERE id = $1',
        [rem['id'] as string],
      );
      if (existing.length > 0) {
        await db.execute(
          `UPDATE reminders SET name = $1, description = $2, category_id = $3, schedule_type = $4,
           schedule_config = $5, next_trigger_at = $6, status = $7, priority = $8, notes = $9, updated_at = $10
           WHERE id = $11`,
          [
            rem['name'],
            rem['description'],
            rem['category_id'],
            rem['schedule_type'],
            rem['schedule_config'],
            rem['next_trigger_at'],
            rem['status'],
            rem['priority'],
            rem['notes'],
            new Date().toISOString(),
            rem['id'],
          ],
        );
      } else {
        await db.execute(
          `INSERT INTO reminders (id, name, description, category_id, schedule_type, schedule_config,
           next_trigger_at, status, priority, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            rem['id'],
            rem['name'],
            rem['description'],
            rem['category_id'],
            rem['schedule_type'],
            rem['schedule_config'],
            rem['next_trigger_at'],
            rem['status'],
            rem['priority'],
            rem['notes'],
            rem['created_at'] ?? new Date().toISOString(),
            new Date().toISOString(),
          ],
        );
      }

      // Import subtasks
      const subtasks = (rem['subtasks'] ?? []) as Array<Record<string, unknown>>;
      for (const sub of subtasks) {
        const existingSub = await db.select<Array<{ id: string }>>(
          'SELECT id FROM subtasks WHERE id = $1',
          [sub['id'] as string],
        );
        if (existingSub.length === 0) {
          await db.execute(
            'INSERT INTO subtasks (id, reminder_id, title, is_completed, sort_order, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              sub['id'],
              sub['reminder_id'],
              sub['title'],
              sub['is_completed'] ?? 0,
              sub['sort_order'] ?? 0,
              sub['created_at'] ?? new Date().toISOString(),
            ],
          );
        }
      }
    }

    // Update settings if present
    if (data.settings && data.settings['id']) {
      await db.execute(
        'UPDATE users SET timezone = $1, preferences = $2 WHERE id = (SELECT id FROM users LIMIT 1)',
        [data.settings['timezone'] ?? 'UTC', data.settings['preferences'] ?? '{}'],
      );
    }

    emit(EVENTS.REMINDERS_CHANGED);
    emit(EVENTS.CATEGORIES_CHANGED);
    emit(EVENTS.SETTINGS_CHANGED);
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
}
