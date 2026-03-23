import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star, Trash2, Edit3, X, Check, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { Category } from '@wiwf/shared';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleFavorite,
} from '@/hooks/useCategories';
import { getCategoryReminderCount } from '@/services/categories.service';
import { useAppStore } from '@/store/app.store';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';

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
  '#6B7280',
];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { data: categories, loading } = useCategories();
  const { mutate: createCategory, loading: creating } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: toggleFavorite } = useToggleFavorite();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[4]!);
  const [newIcon, setNewIcon] = useState('tag');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const { setSelectedCategory, setView } = useAppStore();

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  /** Navigate to Home page filtered by the clicked category */
  const handleNavigateToCategory = (catId: string) => {
    setSelectedCategory(catId);
    setView('all');
    navigate('/');
  };

  useEffect(() => {
    async function loadCounts() {
      const counts: Record<string, number> = {};
      for (const cat of categories) {
        counts[cat.id] = await getCategoryReminderCount(cat.id);
      }
      setCategoryCounts(counts);
    }
    if (categories.length > 0) {
      loadCounts();
    }
  }, [categories]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCategory({ name: newName.trim(), color: newColor, icon: newIcon });
    setNewName('');
    setNewColor(PRESET_COLORS[4]!);
    setNewIcon('tag');
    setShowCreate(false);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateCategory(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  };

  const favorites = categories.filter((c) => c.isFavorite);
  const regular = categories.filter((c) => !c.isFavorite);

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Categories
            </h1>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-primary gap-1.5"
            >
              <Plus size={16} />
              New Category
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="card p-4 mb-6 animate-scale-in">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                New Category
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                  }}
                />
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className={clsx(
                          'w-7 h-7 rounded-full transition-transform',
                          newColor === color && 'ring-2 ring-offset-2 scale-110',
                        )}
                        style={{
                          backgroundColor: color,
                          ['--tw-ring-color' as string]: color,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="btn-primary flex-1"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && <LoadingSkeleton count={4} />}

          {!loading && categories.length === 0 && (
            <EmptyState
              title="No categories"
              description="Create your first category to organize your reminders."
              actionLabel="Create Category"
              onAction={() => setShowCreate(true)}
            />
          )}

          {/* Favorites */}
          {favorites.length > 0 && (
            <section className="mb-6">
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                Favorites
              </h2>
              <div className="space-y-1.5">
                {favorites.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    count={categoryCounts[cat.id] ?? 0}
                    editing={editingId === cat.id}
                    editName={editName}
                    editColor={editColor}
                    onEditNameChange={setEditName}
                    onEditColorChange={setEditColor}
                    onStartEdit={() => startEdit(cat)}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onToggleFavorite={() => toggleFavorite(cat.id)}
                    onDelete={() => setDeleteTarget(cat)}
                    onNavigate={() => handleNavigateToCategory(cat.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Regular categories */}
          {regular.length > 0 && (
            <section>
              {favorites.length > 0 && (
                <h2
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  All Categories
                </h2>
              )}
              <div className="space-y-1.5">
                {regular.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    count={categoryCounts[cat.id] ?? 0}
                    editing={editingId === cat.id}
                    editName={editName}
                    editColor={editColor}
                    onEditNameChange={setEditName}
                    onEditColorChange={setEditColor}
                    onStartEdit={() => startEdit(cat)}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onToggleFavorite={() => toggleFavorite(cat.id)}
                    onDelete={() => setDeleteTarget(cat)}
                    onNavigate={() => handleNavigateToCategory(cat.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Reminders in this category will become uncategorized.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface CategoryRowProps {
  category: Category;
  count: number;
  editing: boolean;
  editName: string;
  editColor: string;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  /** Click handler to navigate to this category's reminders */
  onNavigate: () => void;
}

function CategoryRow({
  category,
  count,
  editing,
  editName,
  editColor,
  onEditNameChange,
  onEditColorChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleFavorite,
  onDelete,
  onNavigate,
}: CategoryRowProps) {
  if (editing) {
    return (
      <div className="card p-3 animate-scale-in">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {PRESET_COLORS.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onEditColorChange(color)}
                className={clsx(
                  'w-5 h-5 rounded-full',
                  editColor === color && 'ring-2 ring-offset-1',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="input-field flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button
            type="button"
            onClick={onSaveEdit}
            className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            <Check size={16} className="text-emerald-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group card-hover p-3 flex items-center gap-3 cursor-pointer"
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onNavigate();
      }}
      title={`View reminders in "${category.name}"`}
    >
      <span
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.color }}
      />
      <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {category.name}
      </span>
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
      >
        {count}
      </span>

      {/* Actions on hover — stop propagation so clicks don't trigger navigation */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onToggleFavorite}
          className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
          aria-label={category.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            size={14}
            className={clsx(category.isFavorite ? 'text-amber-400' : 'text-gray-400')}
            fill={category.isFavorite ? 'currentColor' : 'none'}
          />
        </button>
        <button
          type="button"
          onClick={onStartEdit}
          className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
          aria-label="Edit category"
        >
          <Edit3 size={14} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          aria-label="Delete category"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
      {/* Right chevron hint for clickability */}
      <ChevronRight
        size={14}
        className="flex-shrink-0 opacity-40 group-hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
      />
    </div>
  );
}
