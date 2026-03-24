import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { formatScheduleDescription, SNOOZE_OPTIONS } from '@ohright/shared';
import type { ReminderPriority } from '@ohright/shared';
import {
  useReminder,
  useUpdateReminder,
  useDeleteReminder,
  useCompleteReminder,
  useSnoozeReminder,
  useSkipReminder,
  useToggleSubtask,
} from '../../src/hooks/useReminders';
import { useCategories } from '../../src/hooks/useCategories';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
import { SubtaskItem } from '../../src/components/SubtaskItem';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
  info: '#94A3B8',
};

export default function ReminderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const { data: reminder, loading } = useReminder(id);
  const { data: categories } = useCategories();
  const { mutate: updateReminder } = useUpdateReminder();
  const { mutate: deleteReminder } = useDeleteReminder();
  const { mutate: completeReminder } = useCompleteReminder();
  const { mutate: snoozeReminder } = useSnoozeReminder();
  const { mutate: skipReminder } = useSkipReminder();
  const { mutate: toggleSubtask } = useToggleSubtask();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPriority, setEditPriority] = useState<ReminderPriority>('medium');

  const category = useMemo(
    () => categories.find((c) => c.id === reminder?.categoryId),
    [categories, reminder?.categoryId],
  );

  const startEdit = useCallback(() => {
    if (!reminder) return;
    setEditName(reminder.name);
    setEditNotes(reminder.notes ?? '');
    setEditPriority(reminder.priority);
    setIsEditing(true);
  }, [reminder]);

  const handleSaveEdit = useCallback(async () => {
    if (!reminder || !id) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Reminder name cannot be empty.');
      return;
    }
    try {
      await updateReminder(id, {
        name: trimmedName,
        notes: editNotes.trim() || null,
        priority: editPriority,
      });
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update reminder.');
    }
  }, [reminder, id, editName, editNotes, editPriority, updateReminder]);

  const handleComplete = useCallback(async () => {
    if (!id) return;
    try {
      await completeReminder(id);
    } catch {
      Alert.alert('Error', 'Failed to complete reminder.');
    }
  }, [id, completeReminder]);

  const handleSnooze = useCallback(
    async (minutes: number) => {
      if (!id) return;
      setShowSnoozeMenu(false);
      try {
        await snoozeReminder(id, minutes);
      } catch {
        Alert.alert('Error', 'Failed to snooze reminder.');
      }
    },
    [id, snoozeReminder],
  );

  const handleSkip = useCallback(async () => {
    if (!id) return;
    try {
      await skipReminder(id);
    } catch {
      Alert.alert('Error', 'Failed to skip reminder.');
    }
  }, [id, skipReminder]);

  const handlePause = useCallback(async () => {
    if (!id || !reminder) return;
    try {
      await updateReminder(id, {
        status: reminder.status === 'paused' ? 'active' : 'paused',
      });
    } catch {
      Alert.alert('Error', 'Failed to update reminder status.');
    }
  }, [id, reminder, updateReminder]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setShowDeleteConfirm(false);
    try {
      await deleteReminder(id);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to delete reminder.');
    }
  }, [id, deleteReminder, router]);

  const handleToggleSubtask = useCallback(
    async (subtaskId: string, completed: boolean) => {
      try {
        await toggleSubtask(subtaskId, completed);
      } catch {
        // handled by hook
      }
    },
    [toggleSubtask],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!reminder) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Reminder not found</Text>
      </View>
    );
  }

  const completedSubtasks = reminder.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = reminder.subtasks.length;
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;
  const priorityColor = PRIORITY_COLORS[reminder.priority] ?? '#94A3B8';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isEditing ? (
        <>
          <TextInput
            style={styles.editNameInput}
            value={editName}
            onChangeText={setEditName}
            autoFocus
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['high', 'medium', 'low', 'info'] as ReminderPriority[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityChip,
                  editPriority === p && { backgroundColor: PRIORITY_COLORS[p] },
                ]}
                onPress={() => setEditPriority(p)}
              >
                <Text style={[styles.priorityChipText, editPriority === p && { color: '#FFFFFF' }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.editNotesInput]}
            value={editNotes}
            onChangeText={setEditNotes}
            placeholder="Notes"
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelEditText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveEditBtn} onPress={handleSaveEdit}>
              <Text style={styles.saveEditText}>Save</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={styles.title}>{reminder.name}</Text>
            </View>

            {category && (
              <View style={styles.categoryBadge}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            )}

            <Text style={styles.statusBadge}>
              {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
            </Text>
          </View>

          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleLabel}>Schedule</Text>
            <Text style={styles.scheduleDesc}>{formatScheduleDescription(reminder.schedule)}</Text>
            {reminder.nextTriggerAt && (
              <Text style={styles.nextTrigger}>
                Next: {format(new Date(reminder.nextTriggerAt), 'MMM d, yyyy h:mm a')}
              </Text>
            )}
          </View>

          {reminder.description && (
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.descriptionText}>{reminder.description}</Text>
            </View>
          )}

          {totalSubtasks > 0 && (
            <View style={styles.section}>
              <View style={styles.subtaskHeader}>
                <Text style={styles.label}>Subtasks</Text>
                <Text style={styles.subtaskCount}>
                  {completedSubtasks}/{totalSubtasks}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              {reminder.subtasks.map((sub) => (
                <SubtaskItem key={sub.id} subtask={sub} onToggle={handleToggleSubtask} />
              ))}
            </View>
          )}

          {reminder.notes && (
            <View style={styles.section}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.notesText}>{reminder.notes}</Text>
            </View>
          )}

          {reminder.status === 'active' && (
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleComplete}>
                <Text style={styles.actionBtnPrimaryText}>Complete</Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSnoozeMenu(true)}>
                  <Text style={styles.actionBtnText}>Snooze</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSkip}>
                  <Text style={styles.actionBtnText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handlePause}>
                  <Text style={styles.actionBtnText}>Pause</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {reminder.status === 'paused' && (
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handlePause}>
              <Text style={styles.actionBtnPrimaryText}>Resume</Text>
            </TouchableOpacity>
          )}

          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>

          {reminder.completionHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>History</Text>
              {reminder.completionHistory.slice(0, 10).map((record) => (
                <View key={record.id} style={styles.historyRow}>
                  <Text style={styles.historyAction}>
                    {record.action.charAt(0).toUpperCase() + record.action.slice(1)}
                  </Text>
                  <Text style={styles.historyDate}>
                    {format(new Date(record.completedAt), 'MMM d, h:mm a')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.metaText}>
            Created {format(new Date(reminder.createdAt), 'MMM d, yyyy')}
          </Text>
        </>
      )}

      {showSnoozeMenu && (
        <View style={styles.snoozeOverlay}>
          <View style={styles.snoozeCard}>
            <Text style={styles.snoozeTitle}>Snooze for...</Text>
            {SNOOZE_OPTIONS.map((mins) => (
              <TouchableOpacity
                key={mins}
                style={styles.snoozeOption}
                onPress={() => handleSnooze(mins)}
              >
                <Text style={styles.snoozeOptionText}>
                  {mins < 60 ? `${mins} minutes` : `${mins / 60} hour`}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.snoozeCancelBtn}
              onPress={() => setShowSnoozeMenu(false)}
            >
              <Text style={styles.snoozeCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Reminder"
        message={`Permanently delete "${reminder.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    headerSection: {
      marginBottom: 20,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    priorityDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
      marginBottom: 8,
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    categoryName: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statusBadge: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
    scheduleCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    scheduleLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    scheduleDesc: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    nextTrigger: {
      fontSize: 14,
      color: colors.accent,
      marginTop: 6,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    descriptionText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    subtaskHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    subtaskCount: {
      fontSize: 13,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    progressTrack: {
      height: 4,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 2,
    },
    notesText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 12,
    },
    actionsSection: {
      marginBottom: 20,
    },
    actionBtnPrimary: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    actionBtnPrimaryText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    bottomActions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 24,
    },
    editBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    editBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accent,
    },
    deleteBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.dangerLight,
      alignItems: 'center',
    },
    deleteBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.danger,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    historyAction: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    historyDate: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    metaText: {
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 16,
    },
    editNameInput: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.accent,
      marginBottom: 16,
    },
    editNotesInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    priorityRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    priorityChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    priorityChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    editActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelEditBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    cancelEditText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    saveEditBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    saveEditText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    snoozeOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    snoozeCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      width: '100%',
      maxWidth: 300,
    },
    snoozeTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
      textAlign: 'center',
    },
    snoozeOption: {
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    snoozeOptionText: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: '500',
    },
    snoozeCancelBtn: {
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    snoozeCancelText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });
}
