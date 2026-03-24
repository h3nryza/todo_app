import { create } from 'zustand';
import { getDatabase } from '../lib/database';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  loaded: boolean;
  setTheme: (theme: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  loaded: false,
  setTheme: (theme: ThemeMode) => {
    set({ theme });
    getDatabase()
      .then((db) => {
        return db.runAsync(
          `UPDATE users SET preferences = json_set(
            COALESCE(preferences, '{}'), '$.theme', ?
          ) WHERE id = (SELECT id FROM users LIMIT 1)`,
          [theme],
        );
      })
      .catch(() => {});
  },
  loadTheme: async () => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{ preferences: string }>(
        'SELECT preferences FROM users LIMIT 1',
      );
      if (rows.length > 0 && rows[0]!.preferences) {
        const prefs = JSON.parse(rows[0]!.preferences);
        if (prefs.theme === 'light' || prefs.theme === 'dark' || prefs.theme === 'system') {
          set({ theme: prefs.theme, loaded: true });
          return;
        }
      }
      set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
