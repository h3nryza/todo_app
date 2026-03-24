import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabase } from '../src/lib/database';
import { useTheme } from '../src/hooks/useTheme';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors, loaded: themeLoaded } = useTheme();

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>Initialization Error</Text>
        <Text style={[styles.errorMsg, { color: colors.textSecondary }]}>{error}</Text>
      </View>
    );
  }

  if (!ready || !themeLoaded) {
    return (
      <View style={[styles.center, { backgroundColor: '#6366F1' }]}>
        <Text style={styles.splashTitle}>Oh Right!</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppInitializer>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="reminder/new"
            options={{
              headerShown: true,
              title: 'New Reminder',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.accent,
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="reminder/[id]"
            options={{
              headerShown: true,
              title: 'Reminder',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.accent,
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
            }}
          />
        </Stack>
      </AppInitializer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
