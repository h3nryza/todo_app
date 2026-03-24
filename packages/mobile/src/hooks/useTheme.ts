import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore, type ThemeMode } from '../store/theme.store';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  accent: string;
  accentLight: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
}

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  accent: '#6366F1',
  accentLight: '#EEF2FF',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
};

const darkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#334155',
  accent: '#818CF8',
  accentLight: '#1E1B4B',
  danger: '#F87171',
  dangerLight: '#450A0A',
  success: '#34D399',
  successLight: '#022C22',
  warning: '#FBBF24',
  warningLight: '#451A03',
};

export function useTheme() {
  const { theme, setTheme, loadTheme, loaded } = useThemeStore();
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

  const colors: ThemeColors = isDark ? darkColors : lightColors;

  return { theme, setTheme, colors, isDark, loaded };
}

export type { ThemeMode };
