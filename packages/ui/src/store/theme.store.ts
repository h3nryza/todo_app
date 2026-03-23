import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('wiwf-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage may not be available
  }
  return 'system';
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  setTheme: (theme: ThemeMode) => {
    try {
      localStorage.setItem('wiwf-theme', theme);
    } catch {
      // ignore
    }
    set({ theme });
  },
}));
