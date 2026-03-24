import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useTheme, type ThemeColors } from '../hooks/useTheme';

interface CategoryChipProps {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, color, selected, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.chip, selected && { backgroundColor: colors.accent }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {color && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.label, selected && { color: '#FFFFFF' }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
  });
}
