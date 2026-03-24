import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { ScheduleType, ReminderPriority, CreateSubtaskDto } from '@ohright/shared';
import { useCreateReminder } from '../../src/hooks/useReminders';
import { useCategories } from '../../src/hooks/useCategories';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
import { CategoryChip } from '../../src/components/CategoryChip';

const SCHEDULE_TYPES: { key: ScheduleType; label: string }[] = [
  { key: 'once', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly_date', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const PRIORITY_OPTIONS: { key: ReminderPriority; label: string; color: string }[] = [
  { key: 'high', label: 'High', color: '#EF4444' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'low', label: 'Low', color: '#3B82F6' },
  { key: 'info', label: 'Info', color: '#94A3B8' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function NewReminderScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { mutate: createReminder, loading } = useCreateReminder();
  const { data: categories } = useCategories();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('once');
  const [priority, setPriority] = useState<ReminderPriority>('medium');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<CreateSubtaskDto[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const handleAddSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    setSubtasks([...subtasks, { title }]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) setTime(selectedTime);
  };

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Please enter a reminder name.');
      return;
    }

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeOfDay = `${hours}:${minutes}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      await createReminder({
        name: trimmedName,
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        priority,
        notes: notes.trim() || undefined,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        schedule: {
          type: scheduleType,
          startDate: date.toISOString(),
          timeOfDay,
          timezone: tz,
          ...(scheduleType === 'weekly' ? { daysOfWeek: selectedDays } : {}),
          ...(scheduleType === 'monthly_date' ? { dayOfMonth } : {}),
        },
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    }
  }, [
    name,
    description,
    categoryId,
    scheduleType,
    priority,
    notes,
    subtasks,
    date,
    time,
    selectedDays,
    dayOfMonth,
    createReminder,
    router,
  ]);

  const favorites = categories.filter((c) => c.isFavorite);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.fieldLabel}>Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="What do you need to remember?"
        placeholderTextColor={colors.textTertiary}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={styles.fieldLabel}>Category</Text>
      {favorites.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {favorites.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              color={cat.color}
              selected={categoryId === cat.id}
              onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
            />
          ))}
        </ScrollView>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <CategoryChip
          label="None"
          selected={categoryId === null}
          onPress={() => setCategoryId(null)}
        />
        {categories
          .filter((c) => !c.isFavorite)
          .map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              color={cat.color}
              selected={categoryId === cat.id}
              onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
            />
          ))}
      </ScrollView>

      <Text style={styles.fieldLabel}>Schedule</Text>
      <View style={styles.scheduleRow}>
        {SCHEDULE_TYPES.map((st) => (
          <TouchableOpacity
            key={st.key}
            style={[
              styles.scheduleChip,
              scheduleType === st.key && { backgroundColor: colors.accent },
            ]}
            onPress={() => setScheduleType(st.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.scheduleChipText, scheduleType === st.key && { color: '#FFFFFF' }]}
            >
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Date</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.pickerText}>
          {date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.fieldLabel}>Time</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.pickerText}>
          {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {scheduleType === 'weekly' && (
        <>
          <Text style={styles.fieldLabel}>Days of Week</Text>
          <View style={styles.daysRow}>
            {DAY_LABELS.map((label, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayChip,
                  selectedDays.includes(idx) && { backgroundColor: colors.accent },
                ]}
                onPress={() => toggleDay(idx)}
              >
                <Text
                  style={[styles.dayChipText, selectedDays.includes(idx) && { color: '#FFFFFF' }]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {scheduleType === 'monthly_date' && (
        <>
          <Text style={styles.fieldLabel}>Day of Month</Text>
          <TextInput
            style={styles.input}
            placeholder="1-31 or -1 for last day"
            placeholderTextColor={colors.textTertiary}
            value={dayOfMonth.toString()}
            onChangeText={(text) => {
              const num = parseInt(text, 10);
              if (!isNaN(num)) setDayOfMonth(num);
            }}
            keyboardType="number-pad"
          />
        </>
      )}

      <Text style={styles.fieldLabel}>Priority</Text>
      <View style={styles.priorityRow}>
        {PRIORITY_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.priorityChip, priority === p.key && { backgroundColor: p.color }]}
            onPress={() => setPriority(p.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.priorityChipText, priority === p.key && { color: '#FFFFFF' }]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Optional description"
        placeholderTextColor={colors.textTertiary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.fieldLabel}>Subtasks</Text>
      {subtasks.map((sub, idx) => (
        <View key={idx} style={styles.subtaskRow}>
          <Text style={styles.subtaskText}>{sub.title}</Text>
          <TouchableOpacity onPress={() => handleRemoveSubtask(idx)}>
            <Text style={styles.removeSubtask}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.subtaskInputRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Add a subtask"
          placeholderTextColor={colors.textTertiary}
          value={newSubtask}
          onChangeText={setNewSubtask}
          onSubmitEditing={handleAddSubtask}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addSubtaskBtn}
          onPress={handleAddSubtask}
          disabled={!newSubtask.trim()}
        >
          <Text style={[styles.addSubtaskText, !newSubtask.trim() && { opacity: 0.4 }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Additional notes"
        placeholderTextColor={colors.textTertiary}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Create Reminder'}</Text>
      </TouchableOpacity>
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
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 18,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    chipRow: {
      paddingVertical: 4,
    },
    scheduleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    scheduleChip: {
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    scheduleChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    pickerButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerText: {
      fontSize: 16,
      color: colors.text,
    },
    daysRow: {
      flexDirection: 'row',
      gap: 6,
    },
    dayChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    dayChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    priorityRow: {
      flexDirection: 'row',
      gap: 8,
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
    subtaskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subtaskText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    removeSubtask: {
      fontSize: 16,
      color: colors.textTertiary,
      paddingLeft: 12,
    },
    subtaskInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    addSubtaskBtn: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    addSubtaskText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accent,
    },
    saveButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 28,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    saveButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
