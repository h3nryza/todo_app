import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    // eslint-disable-next-line no-console
    console.log('[DB] Opening SQLite database...');
    try {
      db = await SQLite.openDatabaseAsync('ohright.db');
      // eslint-disable-next-line no-console
      console.log('[DB] Database opened, running migrations...');
      await runMigrations(db);
      // eslint-disable-next-line no-console
      console.log('[DB] Migrations complete');
    } catch (err) {
      console.error('[DB] Failed to initialize:', err); // eslint-disable-line no-console
      db = null;
      throw err;
    }
  }
  return db;
}

function generateUUID(): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += hex[Math.floor(Math.random() * 4) + 8];
    } else {
      uuid += hex[Math.floor(Math.random() * 16)];
    }
  }
  return uuid;
}

export { generateUUID };

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      preferences TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366F1',
      icon TEXT NOT NULL DEFAULT 'tag',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      schedule_type TEXT NOT NULL DEFAULT 'once',
      schedule_config TEXT NOT NULL DEFAULT '{}',
      next_trigger_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      priority TEXT NOT NULL DEFAULT 'medium',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      reminder_id TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS completion_records (
      id TEXT PRIMARY KEY,
      reminder_id TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      scheduled_for TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      action TEXT NOT NULL DEFAULT 'completed',
      subtask_snapshot TEXT NOT NULL DEFAULT '[]'
    )
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status)
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_reminders_next_trigger ON reminders(next_trigger_at)
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_reminders_category ON reminders(category_id)
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_subtasks_reminder ON subtasks(reminder_id)
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_completion_reminder ON completion_records(reminder_id)
  `);

  // Seed default user settings if not exists
  const users = await database.getAllAsync<{ id: string }>('SELECT id FROM users LIMIT 1');
  if (users.length === 0) {
    const userId = generateUUID();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaultPrefs = JSON.stringify({
      defaultReminderTime: '09:00',
      quietHoursStart: null,
      quietHoursEnd: null,
      theme: 'system',
      firstDayOfWeek: 0,
    });
    await database.runAsync('INSERT INTO users (id, timezone, preferences) VALUES (?, ?, ?)', [
      userId,
      tz,
      defaultPrefs,
    ]);
  }
}
