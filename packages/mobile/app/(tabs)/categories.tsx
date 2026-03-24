import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Category } from '@ohright/shared';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleFavorite,
} from '../../src/hooks/useCategories';
import { getCategoryReminderCount } from '../../src/services/categories.service';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
import { EmptyState } from '../../src/components/EmptyState';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

const PRESET_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#06B6D4',
  '#84CC16',
  '#A855F7',
];

const PRESET_ICONS = [
  'tag',
  'heart-pulse',
  'briefcase',
  'user',
  'home',
  'shopping-cart',
  'receipt',
  'car',
  'plane',
  'book',
  'star',
  'bell',
];

const ICON_DISPLAY: Record<string, string> = {
  tag: '🏷️',
  'heart-pulse': '❤️',
  briefcase: '💼',
  user: '👤',
  home: '🏠',
  'shopping-cart': '🛒',
  receipt: '🧾',
  car: '🚗',
  plane: '✈️',
  book: '📖',
  star: '⭐',
  bell: '🔔',
};

export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const { data: categories, loading, refetch } = useCategories();
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: toggleFavorite } = useToggleFavorite();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]!);
  const [formIcon, setFormIcon] = useState(PRESET_ICONS[0]!);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    async function loadCounts() {
      const newCounts = new Map<string, number>();
      for (const cat of categories) {
        const count = await getCategoryReminderCount(cat.id);
        newCounts.set(cat.id, count);
      }
      setCounts(newCounts);
    }
    if (categories.length > 0) {
      loadCounts();
    }
  }, [categories]);

  const resetForm = () => {
    setFormName('');
    setFormColor(PRESET_COLORS[0]!);
    setFormIcon(PRESET_ICONS[0]!);
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) return;

    try {
      if (editId) {
        await updateCategory(editId, { name, color: formColor, icon: formIcon });
      } else {
        await createCategory({ name, color: formColor, icon: formIcon });
      }
      resetForm();
    } catch {
      Alert.alert('Error', 'Failed to save category.');
    }
  };

  const handleEdit = (cat: Category) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormIcon(cat.icon);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      Alert.alert('Error', 'Failed to delete category.');
    }
  };

  const handleToggleFav = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch {
      // handled by hook
    }
  };

  const favorites = categories.filter((c) => c.isFavorite);
  const others = categories.filter((c) => !c.isFavorite);

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.catCard}
      onPress={() => {
        router.push({ pathname: '/(tabs)/all', params: { category: item.id } });
      }}
      onLongPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.catRow}>
        <View style={[styles.catColorDot, { backgroundColor: item.color }]} />
        <View style={styles.catInfo}>
          <Text style={styles.catName}>{item.name}</Text>
          <Text style={styles.catCount}>
            {counts.get(item.id) ?? 0} reminder{(counts.get(item.id) ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.catIcon}>{ICON_DISPLAY[item.icon] ?? '🏷️'}</Text>
      </View>
      <View style={styles.catActions}>
        <TouchableOpacity
          onPress={() => handleToggleFav(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.favIcon}>{item.isFavorite ? '★' : '☆'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDeleteTarget(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const allCats = [...favorites, ...others];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
        <Text style={styles.addButtonText}>+ New Category</Text>
      </TouchableOpacity>

      {allCats.length === 0 && !loading ? (
        <EmptyState
          title="No categories yet"
          message="Create categories to organize your reminders."
          icon="📂"
        />
      ) : (
        <FlatList
          data={allCats}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListHeaderComponent={
            favorites.length > 0 ? <Text style={styles.sectionLabel}>Favorites</Text> : null
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Category' : 'New Category'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Category name"
              placeholderTextColor={colors.textTertiary}
              value={formName}
              onChangeText={setFormName}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    formColor === c && styles.colorSelected,
                  ]}
                  onPress={() => setFormColor(c)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconOption,
                    formIcon === ic && {
                      backgroundColor: colors.accentLight,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setFormIcon(ic)}
                >
                  <Text style={styles.iconEmoji}>{ICON_DISPLAY[ic] ?? '🏷️'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !formName.trim() && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={!formName.trim()}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Reminders in this category will become uncategorized.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    addButton: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: colors.accentLight,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.accent,
      borderStyle: 'dashed',
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accent,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    catCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    catColorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    catInfo: {
      flex: 1,
    },
    catName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    catCount: {
      fontSize: 13,
      color: colors.textTertiary,
      marginTop: 2,
    },
    catIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    catActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    favIcon: {
      fontSize: 20,
      color: '#F59E0B',
    },
    deleteIcon: {
      fontSize: 16,
      color: colors.textTertiary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    colorSelected: {
      borderWidth: 3,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    iconOption: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    iconEmoji: {
      fontSize: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    saveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    saveBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
