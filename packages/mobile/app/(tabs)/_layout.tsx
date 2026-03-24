import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Home: focused ? '◉' : '○',
    All: focused ? '▣' : '□',
    Categories: focused ? '◈' : '◇',
    Settings: focused ? '⚙' : '⚙',
  };
  return <Text style={[styles.icon, { color }]}>{icons[label] ?? '○'}</Text>;
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: 4,
          height: 84,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
          fontSize: 20,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Oh Right!',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="all"
        options={{
          title: 'All',
          headerTitle: 'All Reminders',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="All" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          headerTitle: 'Categories',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Categories" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 22,
  },
});
