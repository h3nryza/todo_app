import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, StickyNote, ListChecks } from 'lucide-react';
import { clsx } from 'clsx';
import type { ScheduleType, ReminderPriority } from '@wiwf/shared';
import { useCreateReminder } from '@/hooks/useReminders';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import Sidebar from '@/components/Sidebar';
import SchedulePicker from '@/components/SchedulePicker';
import CategoryChip from '@/components/CategoryChip';

/** Preset colors for inline category creation */
const QUICK_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6'];

const priorities: Array<{ value: ReminderPriority; label: string; dotClass: string }> = [
  { value: 'high', label: 'High', dotClass: 'bg-red-500' },
  { value: 'medium', label: 'Medium', dotClass: 'bg-indigo-500' },
  { value: 'low', label: 'Low', dotClass: 'bg-amber-400' },
  { value: 'info', label: 'Info', dotClass: 'bg-gray-400' },
];

export default function NewReminderPage() {
  const navigate = useNavigate();
  const { mutate: createReminder, loading: saving } = useCreateReminder();
  const { data: categories } = useCategories();
  const { mutate: createCategory, loading: creatingCategory } = useCreateCategory();

  // Form state
  const [name, setName] = useState('');
  // Inline new-category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(QUICK_COLORS[3]!);
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<ReminderPriority>('medium');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('once');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]!);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  const [secondTimeOfDay, setSecondTimeOfDay] = useState('18:00');
  const [endDate, setEndDate] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [notes, setNotes] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const favoriteCategories = categories.filter((c) => c.isFavorite);

  /** Create a new category inline and auto-select it */
  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    try {
      const created = await createCategory({ name: trimmed, color: newCategoryColor, icon: 'tag' });
      setCategoryId(created.id);
      setShowNewCategory(false);
      setNewCategoryName('');
      setNewCategoryColor(QUICK_COLORS[3]!);
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors['name'] = 'Name is required';
    }
    // Category is optional — no validation needed
    if (scheduleType === 'weekly' && daysOfWeek.length === 0) {
      newErrors['daysOfWeek'] = 'Select at least one day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (trimmed) {
      setSubtasks([...subtasks, trimmed]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const startDateISO = new Date(`${startDate}T${timeOfDay}:00`).toISOString();

    try {
      await createReminder({
        name: name.trim(),
        categoryId: categoryId || undefined,
        priority,
        schedule: {
          type: scheduleType,
          startDate: startDateISO,
          timeOfDay,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(scheduleType === 'twice_daily' ? { secondTimeOfDay } : {}),
          ...(scheduleType === 'daily' || scheduleType === 'hourly' ? { interval } : {}),
          ...(scheduleType === 'weekly' ? { daysOfWeek } : {}),
          ...(scheduleType === 'monthly_date' ? { dayOfMonth } : {}),
          ...(scheduleType === 'monthly_weekday' ? { weekOfMonth, daysOfWeek } : {}),
          ...(endDate ? { endDate: new Date(`${endDate}T23:59:59`).toISOString() } : {}),
        },
        notes: notes.trim() || undefined,
        subtasks: subtasks.map((title) => ({ title })),
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-soft transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
              aria-label="Go back"
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              New Reminder
            </h1>
          </div>

          <div className="space-y-6">
            {/* Name input */}
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What do you need to remember?"
                className={clsx(
                  'input-field text-lg font-medium py-3',
                  errors['name'] && 'border-red-400',
                )}
              />
              {errors['name'] && <p className="text-xs text-red-500 mt-1">{errors['name']}</p>}
            </div>

            {/* Category picker with inline creation */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Category
              </label>
              {/* Favorites as quick chips */}
              {favoriteCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {favoriteCategories.map((cat) => (
                    <CategoryChip
                      key={cat.id}
                      name={cat.name}
                      color={cat.color}
                      selected={categoryId === cat.id}
                      onClick={() => setCategoryId(cat.id)}
                    />
                  ))}
                </div>
              )}
              {/* Dropdown + New Category button */}
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={clsx('input-field flex-1', errors['categoryId'] && 'border-red-400')}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="btn-secondary gap-1 whitespace-nowrap"
                  title="Create a new category"
                >
                  <Plus size={14} />
                  New
                </button>
              </div>
              {errors['categoryId'] && (
                <p className="text-xs text-red-500 mt-1">{errors['categoryId']}</p>
              )}

              {/* Inline new category form */}
              {showNewCategory && (
                <div
                  className="mt-3 p-3 rounded-soft animate-scale-in space-y-2"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="input-field"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                      if (e.key === 'Escape') setShowNewCategory(false);
                    }}
                  />
                  {/* Color picker */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Color:
                    </span>
                    {QUICK_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryColor(color)}
                        className={clsx(
                          'w-6 h-6 rounded-full transition-transform',
                          newCategoryColor === color && 'ring-2 ring-offset-1 scale-110',
                        )}
                        style={{ backgroundColor: color, ['--tw-ring-color' as string]: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory || !newCategoryName.trim()}
                      className="btn-primary flex-1 text-sm"
                    >
                      {creatingCategory ? 'Creating...' : 'Create & Select'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Schedule
              </label>
              <SchedulePicker
                type={scheduleType}
                onTypeChange={setScheduleType}
                startDate={startDate}
                onStartDateChange={setStartDate}
                timeOfDay={timeOfDay}
                onTimeOfDayChange={setTimeOfDay}
                secondTimeOfDay={secondTimeOfDay}
                onSecondTimeOfDayChange={setSecondTimeOfDay}
                interval={interval}
                onIntervalChange={setInterval}
                daysOfWeek={daysOfWeek}
                onDaysOfWeekChange={setDaysOfWeek}
                dayOfMonth={dayOfMonth}
                onDayOfMonthChange={setDayOfMonth}
                weekOfMonth={weekOfMonth}
                onWeekOfMonthChange={setWeekOfMonth}
                endDate={endDate}
                onEndDateChange={setEndDate}
              />
              {errors['daysOfWeek'] && (
                <p className="text-xs text-red-500 mt-1">{errors['daysOfWeek']}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Priority
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                      priority === p.value ? 'ring-2 ring-offset-1' : '',
                    )}
                    style={
                      priority === p.value
                        ? ({
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            ['--tw-ring-color' as string]: 'var(--accent)',
                          } as React.CSSProperties)
                        : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                    }
                  >
                    <span className={clsx('w-2 h-2 rounded-full', p.dotClass)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtasks toggle */}
            {!showSubtasks ? (
              <button
                type="button"
                onClick={() => setShowSubtasks(true)}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                <ListChecks size={16} />
                Add subtasks
              </button>
            ) : (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Subtasks
                </label>
                <div className="space-y-2 mb-2">
                  {subtasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 py-1.5 px-3 rounded-soft"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {task}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        className="p-0.5 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                      >
                        <X size={14} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add a subtask"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="btn-secondary px-3"
                    disabled={!newSubtask.trim()}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Notes toggle */}
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                <StickyNote size={16} />
                Add notes
              </button>
            ) : (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            )}

            {/* Save button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary w-full py-3 text-base"
              >
                {saving ? 'Creating...' : 'Create Reminder'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
