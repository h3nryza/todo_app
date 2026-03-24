import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import type { Reminder, Category } from '@ohright/shared';
import { useReminders, useCompleteReminder } from '../../src/hooks/useReminders';
import { useCategories } from '../../src/hooks/useCategories';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
import { useAppStore, type ViewMode } from '../../src/store/app.store';
import { ReminderCard } from '../../src/components/ReminderCard';
import { EmptyState } from '../../src/components/EmptyState';
import { FAB } from '../../src/components/FAB';

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'this_week', label: 'This Week' },
  { key: 'all', label: 'All' },
];

function filterByView(reminders: Reminder[], view: ViewMode): Reminder[] {
  if (view === 'all') return reminders;
  return reminders.filter((r) => {
    if (!r.nextTriggerAt) return false;
    const date = new Date(r.nextTriggerAt);
    switch (view) {
      case 'today':
        return isToday(date) || isPast(date);
      case 'tomorrow':
        return isTomorrow(date);
      case 'this_week':
        return isThisWeek(date, { weekStartsOn: 0 });
      default:
        return true;
    }
  });
}

interface Section {
  title: string;
  data: Reminder[];
  accent?: string;
}

function groupReminders(reminders: Reminder[]): Section[] {
  const overdue: Reminder[] = [];
  const todayList: Reminder[] = [];
  const upcoming: Reminder[] = [];

  for (const r of reminders) {
    if (r.status !== 'active') continue;
    if (!r.nextTriggerAt) {
      upcoming.push(r);
      continue;
    }
    const date = new Date(r.nextTriggerAt);
    if (isPast(date)) {
      overdue.push(r);
    } else if (isToday(date)) {
      todayList.push(r);
    } else {
      upcoming.push(r);
    }
  }

  const sections: Section[] = [];
  if (overdue.length > 0) sections.push({ title: 'Overdue', data: overdue, accent: '#EF4444' });
  if (todayList.length > 0) sections.push({ title: 'Today', data: todayList });
  if (upcoming.length > 0) sections.push({ title: 'Upcoming', data: upcoming });
  return sections;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { searchQuery, setSearchQuery, view, setView } = useAppStore();

  const {
    data: reminders,
    loading,
    refetch,
  } = useReminders({
    status: 'active',
    search: searchQuery || undefined,
  });
  const { data: categories } = useCategories();
  const { mutate: completeReminder } = useCompleteReminder();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filtered = useMemo(() => filterByView(reminders, view), [reminders, view]);
  const sections = useMemo(() => groupReminders(filtered), [filtered]);

  const handleReminderPress = useCallback((id: string) => router.push(`/reminder/${id}`), [router]);

  const handleComplete = useCallback(
    async (id: string) => {
      try {
        await completeReminder(id);
      } catch {
        // handled by hook
      }
    },
    [completeReminder],
  );

  const allItems = useMemo(() => {
    const items: Array<
      { type: 'header'; title: string; accent?: string } | { type: 'reminder'; item: Reminder }
    > = [];
    for (const section of sections) {
      items.push({ type: 'header', title: section.title, accent: section.accent });
      for (const r of section.data) {
        items.push({ type: 'reminder', item: r });
      }
    }
    return items;
  }, [sections]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search reminders..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {VIEW_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.viewChip, view === opt.key && { backgroundColor: colors.accent }]}
            onPress={() => setView(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewChipText, view === opt.key && { color: '#FFFFFF' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {allItems.length === 0 && !loading ? (
        <EmptyState
          title="All caught up!"
          message={
            view === 'today'
              ? 'No reminders for today. Tap + to create one.'
              : 'No reminders found. Tap + to create your first reminder.'
          }
          icon="🎉"
        />
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item, _idx) =>
            item.type === 'header' ? `header-${item.title}` : `reminder-${item.item.id}`
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text
                  style={[styles.sectionHeader, item.accent ? { color: item.accent } : undefined]}
                >
                  {item.title}
                </Text>
              );
            }
            return (
              <ReminderCard
                reminder={item.item}
                category={categoryMap.get(item.item.categoryId)}
                onPress={handleReminderPress}
                onComplete={handleComplete}
              />
            );
          }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB onPress={() => router.push('/reminder/new')} />
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
      paddingVertical: 10,
      gap: 8,
    },
    viewChip: {
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
    },
    viewChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 6,
    },
  });
}
