import React, { useMemo, useState, useCallback } from 'react';
import { View, TextInput, FlatList, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import type { Category, ReminderStatus } from '@ohright/shared';
import { useReminders } from '../../src/hooks/useReminders';
import { useCategories } from '../../src/hooks/useCategories';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
import { ReminderCard } from '../../src/components/ReminderCard';
import { CategoryChip } from '../../src/components/CategoryChip';
import { EmptyState } from '../../src/components/EmptyState';

const STATUS_TABS: { key: ReminderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Done' },
];

export default function AllScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const {
    data: reminders,
    loading,
    refetch,
  } = useReminders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    categoryId: categoryFilter || undefined,
    search: search || undefined,
  });
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const handlePress = useCallback((id: string) => router.push(`/reminder/${id}`), [router]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search all reminders..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {STATUS_TABS.map((tab) => (
          <CategoryChip
            key={tab.key}
            label={tab.label}
            selected={statusFilter === tab.key}
            onPress={() => setStatusFilter(tab.key)}
          />
        ))}
      </ScrollView>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <CategoryChip
            label="All Categories"
            selected={categoryFilter === null}
            onPress={() => setCategoryFilter(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              color={cat.color}
              selected={categoryFilter === cat.id}
              onPress={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
            />
          ))}
        </ScrollView>
      )}

      {reminders.length === 0 && !loading ? (
        <EmptyState
          title="No reminders found"
          message="Try adjusting your filters or create a new reminder."
          icon="🔍"
        />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReminderCard
              reminder={item}
              category={categoryMap.get(item.categoryId)}
              onPress={handlePress}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    searchInput: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    chipRow: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
  });
}
