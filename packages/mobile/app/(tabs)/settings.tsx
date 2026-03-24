import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { APP_NAME } from '@ohright/shared';
import { useTheme, type ThemeColors, type ThemeMode } from '../../src/hooks/useTheme';
import {
  isPermissionGranted,
  requestPermission,
  sendTestNotification,
} from '../../src/services/notifications.service';
import { exportData, importData } from '../../src/services/export.service';

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const styles = createStyles(colors);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  const handleCheckNotifications = async () => {
    const granted = await isPermissionGranted();
    if (granted) {
      setNotifStatus('Notifications are enabled.');
    } else {
      const result = await requestPermission();
      setNotifStatus(
        result ? 'Notifications enabled!' : 'Permission denied. Enable in device settings.',
      );
    }
  };

  const handleTestNotification = async () => {
    const result = await sendTestNotification();
    Alert.alert(result.success ? 'Success' : 'Error', result.message);
  };

  const handleExport = async () => {
    const success = await exportData();
    if (success) {
      Alert.alert('Export Complete', 'Your data has been exported.');
    } else {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
  };

  const handleImport = async () => {
    Alert.alert('Import Data', 'This will merge imported data with your existing data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        onPress: async () => {
          const success = await importData();
          if (success) {
            Alert.alert('Import Complete', 'Your data has been imported successfully.');
          } else {
            Alert.alert('Import Failed', 'Could not import data. Check the file format.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.themeOption, theme === opt.key && { backgroundColor: colors.accent }]}
              onPress={() => setTheme(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeOptionText, theme === opt.key && { color: '#FFFFFF' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingsRow} onPress={handleCheckNotifications}>
          <Text style={styles.settingsRowText}>Check Permission</Text>
          <Text style={styles.settingsRowArrow}>{'>'}</Text>
        </TouchableOpacity>
        {notifStatus && <Text style={styles.statusText}>{notifStatus}</Text>}
        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingsRow} onPress={handleTestNotification}>
          <Text style={styles.settingsRowText}>Send Test Notification</Text>
          <Text style={styles.settingsRowArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingsRow} onPress={handleExport}>
          <Text style={styles.settingsRowText}>Export Data</Text>
          <Text style={styles.settingsRowArrow}>{'>'}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingsRow} onPress={handleImport}>
          <Text style={styles.settingsRowText}>Import Data</Text>
          <Text style={styles.settingsRowArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App</Text>
          <Text style={styles.aboutValue}>{APP_NAME}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>0.0.1-alpha</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Storage</Text>
          <Text style={styles.aboutValue}>Local (SQLite)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Platform</Text>
          <Text style={styles.aboutValue}>Expo / React Native</Text>
        </View>
      </View>

      <Text style={styles.footer}>Built with privacy in mind. All data stays on your device.</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 60,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 24,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    label: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
    },
    themeRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingBottom: 14,
      gap: 8,
    },
    themeOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    settingsRowText: {
      fontSize: 16,
      color: colors.text,
    },
    settingsRowArrow: {
      fontSize: 16,
      color: colors.textTertiary,
      fontWeight: '600',
    },
    statusText: {
      fontSize: 13,
      color: colors.accent,
      paddingHorizontal: 14,
      paddingBottom: 8,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.border,
      marginHorizontal: 14,
    },
    aboutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    aboutLabel: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    aboutValue: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    footer: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 32,
      lineHeight: 20,
    },
  });
}
