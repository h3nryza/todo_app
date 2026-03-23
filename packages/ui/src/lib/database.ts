import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function getDatabase(): Promise<Database> {
  if (!db) {
    console.log('[DB] Loading SQLite database...');
    try {
      db = await withTimeout(Database.load('sqlite:wiwf.db'), 10000, 'Database.load');
      console.log('[DB] Database loaded, running migrations...');
      await withTimeout(runMigrations(db), 10000, 'runMigrations');
      console.log('[DB] Migrations complete');
    } catch (err) {
      console.error('[DB] Failed to initialize:', err);
      db = null;
      throw err;
    }
  }
  return db;
}

async function runMigrations(database: Database): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      preferences TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await database.execute(`
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

  await database.execute(`
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

  await database.execute(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      reminder_id TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS completion_records (
      id TEXT PRIMARY KEY,
      reminder_id TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      scheduled_for TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      action TEXT NOT NULL DEFAULT 'completed',
      subtask_snapshot TEXT NOT NULL DEFAULT '[]'
    )
  `);

  // Create indexes
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_reminders_next_trigger ON reminders(next_trigger_at)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_reminders_category ON reminders(category_id)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_subtasks_reminder ON subtasks(reminder_id)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_completion_reminder ON completion_records(reminder_id)
  `);

  // Seed default user settings if not exists
  const users = await database.select<Array<{ id: string }>>('SELECT id FROM users LIMIT 1');
  if (users.length === 0) {
    const userId = crypto.randomUUID();
    const defaultPrefs = JSON.stringify({
      defaultReminderTime: '09:00',
      quietHoursStart: null,
      quietHoursEnd: null,
      theme: 'system',
      firstDayOfWeek: 0,
    });
    await database.execute('INSERT INTO users (id, timezone, preferences) VALUES ($1, $2, $3)', [
      userId,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultPrefs,
    ]);
  }

  // No default categories — user creates their own from scratch
}
