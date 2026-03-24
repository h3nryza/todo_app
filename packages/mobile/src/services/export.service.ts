import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../lib/database';
import { emit, EVENTS } from '../lib/events';

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

    const users = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM users LIMIT 1');
    const categories = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM categories');
    const reminders = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM reminders');
    const subtasks = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM subtasks');
    const completions = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM completion_records',
    );

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

    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = `${FileSystem.cacheDirectory}ohright-export-${dateStr}.json`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportPayload, null, 2));

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Oh Right! Data',
        UTI: 'public.json',
      });
    }

    return true;
  } catch (err) {
    console.error('Export failed:', err);
    return false;
  }
}

export async function importData(): Promise<boolean> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const fileUri = result.assets[0]!.uri;
    const content = await FileSystem.readAsStringAsync(fileUri);
    const data = JSON.parse(content) as ExportData;

    if (!data.version || !data.categories || !data.reminders) {
      throw new Error('Invalid export file format');
    }

    const db = await getDatabase();

    for (const cat of data.categories) {
      const existing = await db.getAllAsync<{ id: string }>(
        'SELECT id FROM categories WHERE id = ?',
        [cat['id'] as string],
      );
      if (existing.length > 0) {
        await db.runAsync(
          'UPDATE categories SET name = ?, color = ?, icon = ?, is_favorite = ? WHERE id = ?',
          [cat['name'], cat['color'], cat['icon'], cat['is_favorite'], cat['id']],
        );
      } else {
        await db.runAsync(
          'INSERT INTO categories (id, name, color, icon, is_favorite, usage_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
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

    for (const rem of data.reminders) {
      const existing = await db.getAllAsync<{ id: string }>(
        'SELECT id FROM reminders WHERE id = ?',
        [rem['id'] as string],
      );
      if (existing.length > 0) {
        await db.runAsync(
          `UPDATE reminders SET name = ?, description = ?, category_id = ?, schedule_type = ?,
           schedule_config = ?, next_trigger_at = ?, status = ?, priority = ?, notes = ?, updated_at = ?
           WHERE id = ?`,
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
        await db.runAsync(
          `INSERT INTO reminders (id, name, description, category_id, schedule_type, schedule_config,
           next_trigger_at, status, priority, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

      const subtasks = (rem['subtasks'] ?? []) as Array<Record<string, unknown>>;
      for (const sub of subtasks) {
        const existingSub = await db.getAllAsync<{ id: string }>(
          'SELECT id FROM subtasks WHERE id = ?',
          [sub['id'] as string],
        );
        if (existingSub.length === 0) {
          await db.runAsync(
            'INSERT INTO subtasks (id, reminder_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
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

    if (data.settings && data.settings['id']) {
      await db.runAsync(
        'UPDATE users SET timezone = ?, preferences = ? WHERE id = (SELECT id FROM users LIMIT 1)',
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
