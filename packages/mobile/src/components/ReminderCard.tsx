import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import type { Reminder, Category } from '@ohright/shared';
import { useTheme, type ThemeColors } from '../hooks/useTheme';

interface ReminderCardProps {
  reminder: Reminder;
  category?: Category;
  onPress: (id: string) => void;
  onComplete?: (id: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
  info: '#94A3B8',
};

function formatTriggerTime(dateStr: string): string {
  if (!dateStr) return 'Not scheduled';
  const date = new Date(dateStr);
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

export function ReminderCard({ reminder, category, onPress, onComplete }: ReminderCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const isOverdue =
    reminder.nextTriggerAt &&
    isPast(new Date(reminder.nextTriggerAt)) &&
    reminder.status === 'active';
  const priorityColor = PRIORITY_COLORS[reminder.priority] ?? '#94A3B8';

  const completedSubtasks = reminder.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = reminder.subtasks.length;
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;

  return (
    <TouchableOpacity
      style={[styles.card, isOverdue && styles.cardOverdue]}
      onPress={() => onPress(reminder.id)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {reminder.name}
            </Text>
            {onComplete && reminder.status === 'active' && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => onComplete(reminder.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[styles.checkbox, { borderColor: priorityColor }]} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.metaRow}>
            {category && (
              <View style={styles.categoryBadge}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={styles.categoryText}>{category.name}</Text>
              </View>
            )}
            <Text style={[styles.timeText, isOverdue && styles.overdueText]}>
              {reminder.status === 'completed'
                ? 'Completed'
                : reminder.status === 'paused'
                  ? 'Paused'
                  : formatTriggerTime(reminder.nextTriggerAt)}
            </Text>
          </View>

          {totalSubtasks > 0 && (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%`, backgroundColor: colors.accent },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {completedSubtasks}/{totalSubtasks}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginHorizontal: 16,
      marginVertical: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    cardOverdue: {
      borderLeftWidth: 0,
      backgroundColor: colors.dangerLight,
    },
    row: {
      flexDirection: 'row',
    },
    priorityBar: {
      width: 4,
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    content: {
      flex: 1,
      padding: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    completeButton: {
      padding: 4,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 10,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 5,
    },
    categoryText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    timeText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    overdueText: {
      color: colors.danger,
      fontWeight: '600',
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '500',
    },
  });
}
