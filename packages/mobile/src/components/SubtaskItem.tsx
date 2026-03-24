import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Subtask } from '@ohright/shared';
import { useTheme, type ThemeColors } from '../hooks/useTheme';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => void;
}

export function SubtaskItem({ subtask, onToggle }: SubtaskItemProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onToggle(subtask.id, !subtask.isCompleted)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          subtask.isCompleted && {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
          },
        ]}
      >
        {subtask.isCompleted && <Text style={styles.checkmark}>{'✓'}</Text>}
      </View>
      <Text style={[styles.title, subtask.isCompleted && styles.titleCompleted]}>
        {subtask.title}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    title: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    titleCompleted: {
      textDecorationLine: 'line-through',
      color: colors.textTertiary,
    },
  });
}
