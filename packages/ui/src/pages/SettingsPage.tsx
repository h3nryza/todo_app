import { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Download,
  Upload,
  Check,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '@/hooks/useTheme';
import {
  isPermissionGranted,
  requestPermission,
  sendTestNotification,
} from '@/services/notifications.service';
import { exportData, importData } from '@/services/export.service';
import { getDatabase } from '@/lib/database';
import { emit, EVENTS } from '@/lib/events';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';

type ThemeMode = 'light' | 'dark' | 'system';

const themeOptions: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifPermission, setNotifPermission] = useState<boolean | null>(null);
  const [defaultTime, setDefaultTime] = useState('09:00');
  const [testNotifStatus, setTestNotifStatus] = useState<'idle' | 'sending' | 'success' | 'error'>(
    'idle',
  );
  const [testNotifMessage, setTestNotifMessage] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load settings from DB
  useEffect(() => {
    async function loadSettings() {
      try {
        const db = await getDatabase();
        const rows = await db.select<Array<{ preferences: string }>>(
          'SELECT preferences FROM users LIMIT 1',
        );
        if (rows.length > 0 && rows[0]!.preferences) {
          const prefs = JSON.parse(rows[0]!.preferences);
          if (prefs.defaultReminderTime) {
            setDefaultTime(prefs.defaultReminderTime);
          }
        }
      } catch {
        // ignore
      }
    }

    async function checkPermission() {
      const granted = await isPermissionGranted();
      setNotifPermission(granted);
    }

    loadSettings();
    checkPermission();
  }, []);

  const handleSaveDefaultTime = async (time: string) => {
    setDefaultTime(time);
    try {
      const db = await getDatabase();
      const rows = await db.select<Array<{ preferences: string }>>(
        'SELECT preferences FROM users LIMIT 1',
      );
      if (rows.length > 0) {
        const prefs = JSON.parse(rows[0]!.preferences || '{}');
        prefs.defaultReminderTime = time;
        await db.execute(
          'UPDATE users SET preferences = $1 WHERE id = (SELECT id FROM users LIMIT 1)',
          [JSON.stringify(prefs)],
        );
        emit(EVENTS.SETTINGS_CHANGED);
      }
    } catch {
      // ignore
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setNotifPermission(granted);
  };

  /** Send a test notification — shows detailed result message */
  const handleTestNotification = async () => {
    setTestNotifStatus('sending');
    setTestNotifMessage('');
    const result = await sendTestNotification();
    setTestNotifStatus(result.success ? 'success' : 'error');
    setTestNotifMessage(result.message);
    // Re-check permission in case it changed
    const granted = await isPermissionGranted();
    setNotifPermission(granted);
    if (result.success) {
      setTimeout(() => {
        setTestNotifStatus('idle');
        setTestNotifMessage('');
      }, 5000);
    }
  };

  const handleExport = async () => {
    setExportStatus('idle');
    const success = await exportData();
    setExportStatus(success ? 'success' : 'error');
    setTimeout(() => setExportStatus('idle'), 3000);
  };

  const handleImport = async () => {
    setImportStatus('idle');
    const success = await importData();
    setImportStatus(success ? 'success' : 'error');
    setTimeout(() => setImportStatus('idle'), 3000);
  };

  /** Wipe all reminders, categories, and completion records */
  const handleClearDatabase = async () => {
    try {
      const db = await getDatabase();
      await db.execute('DELETE FROM completion_records');
      await db.execute('DELETE FROM subtasks');
      await db.execute('DELETE FROM reminders');
      await db.execute('DELETE FROM categories');
      emit(EVENTS.REMINDERS_CHANGED);
      emit(EVENTS.CATEGORIES_CHANGED);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear database:', err);
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          <h1 className="text-xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h1>

          {/* Theme */}
          <section className="card p-5 mb-4 animate-slide-up">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Appearance
            </h2>
            <div className="flex gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-soft text-sm font-medium transition-all duration-150',
                    theme === opt.value ? 'text-white' : '',
                  )}
                  style={
                    theme === opt.value
                      ? { backgroundColor: 'var(--accent)' }
                      : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                  }
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Default reminder time */}
          <section className="card p-5 mb-4 animate-slide-up">
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Default Reminder Time
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              New reminders will default to this time.
            </p>
            <input
              type="time"
              value={defaultTime}
              onChange={(e) => handleSaveDefaultTime(e.target.value)}
              className="input-field w-40"
            />
          </section>

          {/* Notifications */}
          <section className="card p-5 mb-4 animate-slide-up">
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Enable local notifications to get reminded on time.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                {notifPermission === null ? (
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Checking permission...
                  </span>
                ) : notifPermission ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <Bell size={16} />
                      Notifications enabled
                    </div>
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      disabled={testNotifStatus === 'sending'}
                      className="btn-secondary text-sm py-1.5 gap-1.5"
                    >
                      <Bell size={14} />
                      {testNotifStatus === 'sending' ? 'Sending...' : 'Send Test Notification'}
                      {testNotifStatus === 'success' && (
                        <Check size={14} className="text-emerald-500" />
                      )}
                      {testNotifStatus === 'error' && (
                        <AlertCircle size={14} className="text-red-500" />
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <BellOff size={16} />
                      Notifications disabled
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="btn-primary text-sm py-1.5"
                    >
                      Enable
                    </button>
                  </>
                )}
              </div>

              {/* Detailed result message from test */}
              {testNotifMessage && (
                <div
                  className="rounded-soft p-3 text-xs space-y-1"
                  style={{
                    backgroundColor:
                      testNotifStatus === 'success'
                        ? 'rgba(16,185,129,0.1)'
                        : 'var(--bg-secondary)',
                    border: testNotifStatus === 'error' ? '1px solid var(--danger)' : undefined,
                  }}
                >
                  <p
                    className="font-semibold"
                    style={{
                      color:
                        testNotifStatus === 'success' ? 'var(--success)' : 'var(--text-primary)',
                    }}
                  >
                    {testNotifStatus === 'success' ? 'Notification Sent' : 'Notification Issue'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>{testNotifMessage}</p>
                </div>
              )}

              {/* Permission denied — detailed per-OS guidance */}
              {notifPermission === false && (
                <div
                  className="rounded-soft p-3 text-xs space-y-2"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    How to enable notifications:
                  </p>
                  <ol
                    className="list-decimal list-inside space-y-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <li>Click "Enable" above to request permission</li>
                    <li>If the prompt doesn't appear, enable manually:</li>
                  </ol>
                  <div className="space-y-1 pl-4" style={{ color: 'var(--text-secondary)' }}>
                    <p>
                      <strong>macOS:</strong> System Settings → Notifications → What I Would Forget
                      → Allow Notifications ON. Set to "Alerts" or "Banners". Enable Sound and
                      Badge.
                    </p>
                    <p>
                      <strong>Windows:</strong> Settings → System → Notifications → What I Would
                      Forget → ON
                    </p>
                    <p>
                      <strong>Linux:</strong> Ensure libnotify is installed. Check your DE
                      notification settings.
                    </p>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Ensure Focus / Do Not Disturb is OFF.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Data management */}
          <section className="card p-5 mb-4 animate-slide-up">
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Data Management
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Export or import your reminders as a JSON file.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={handleExport} className="btn-secondary gap-1.5">
                <Download size={16} />
                Export Data
                {exportStatus === 'success' && <Check size={14} className="text-emerald-500" />}
                {exportStatus === 'error' && <AlertCircle size={14} className="text-red-500" />}
              </button>
              <button type="button" onClick={handleImport} className="btn-outline gap-1.5">
                <Upload size={16} />
                Import Data
                {importStatus === 'success' && <Check size={14} className="text-emerald-500" />}
                {importStatus === 'error' && <AlertCircle size={14} className="text-red-500" />}
              </button>
            </div>
          </section>

          {/* Danger zone — clear database */}
          <section
            className="card p-5 mb-4 animate-slide-up"
            style={{ borderColor: 'var(--danger)' }}
          >
            <h2 className="text-sm font-semibold mb-1 text-red-500">Danger Zone</h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Permanently delete all reminders, categories, and history.
            </p>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="btn-danger gap-1.5"
            >
              <Trash2 size={16} />
              Clear All Data
            </button>
          </section>

          {/* About */}
          <section className="card p-5 animate-slide-up">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              About
            </h2>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>App</span>
                <span style={{ color: 'var(--text-primary)' }}>What I Would Forget</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Version</span>
                <span style={{ color: 'var(--text-primary)' }}>0.0.1-alpha</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Architecture</span>
                <span style={{ color: 'var(--text-primary)' }}>Local-first (SQLite)</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear All Data"
        message="This will permanently delete all reminders, categories, subtasks, and history. This cannot be undone."
        confirmLabel="Delete Everything"
        variant="danger"
        onConfirm={handleClearDatabase}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
