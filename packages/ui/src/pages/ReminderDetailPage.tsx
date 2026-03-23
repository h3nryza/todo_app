import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  SkipForward,
  Pause,
  Play,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  formatScheduleDescription,
  formatRelativeTime,
  isOverdue,
  SNOOZE_OPTIONS,
} from '@ohright/shared';
import type { CompletionRecord } from '@ohright/shared';
import { format } from 'date-fns';
import {
  useReminder,
  useCompleteReminder,
  useSnoozeReminder,
  useSkipReminder,
  useUpdateReminder,
  useDeleteReminder,
  useToggleSubtask,
} from '@/hooks/useReminders';
import { useCategories } from '@/hooks/useCategories';
import Sidebar from '@/components/Sidebar';
import SubtaskItem from '@/components/SubtaskItem';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { getDatabase } from '@/lib/database';
import { emit, EVENTS } from '@/lib/events';

export default function ReminderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reminder, loading } = useReminder(id);
  const { data: categories } = useCategories();
  const { mutate: completeReminder, loading: completing } = useCompleteReminder();
  const { mutate: snoozeReminder } = useSnoozeReminder();
  const { mutate: skipReminder, loading: skipping } = useSkipReminder();
  const { mutate: updateReminder } = useUpdateReminder();
  const { mutate: deleteReminder } = useDeleteReminder();
  const { mutate: toggleSubtask } = useToggleSubtask();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  /** Local notes state — editable inline, saves on blur */
  const [localNotes, setLocalNotes] = useState('');
  const notesInitialized = useRef(false);

  // Sync local notes from reminder data on first load
  useEffect(() => {
    if (reminder && !notesInitialized.current) {
      setLocalNotes(reminder.notes ?? '');
      notesInitialized.current = true;
    }
  }, [reminder]);

  /** Save notes to DB when user finishes editing (on blur) */
  const handleNotesSave = async () => {
    if (!id) return;
    const trimmed = localNotes.trim();
    // Only save if changed
    if (trimmed !== (reminder?.notes ?? '').trim()) {
      await updateReminder(id, { notes: trimmed || null });
    }
  };

  /** Add a subtask directly from the detail view */
  const handleAddSubtask = async () => {
    const title = newSubtaskTitle.trim();
    if (!title || !id) return;
    try {
      const db = await getDatabase();
      const sortOrder = reminder ? reminder.subtasks.length : 0;
      await db.execute(
        'INSERT INTO subtasks (id, reminder_id, title, sort_order) VALUES ($1, $2, $3, $4)',
        [crypto.randomUUID(), id, title, sortOrder],
      );
      setNewSubtaskTitle('');
      emit(EVENTS.REMINDERS_CHANGED);
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const category = useMemo(() => {
    if (!reminder) return undefined;
    return categories.find((c) => c.id === reminder.categoryId);
  }, [reminder, categories]);

  const overdue = reminder?.nextTriggerAt ? isOverdue(reminder.nextTriggerAt) : false;

  const subtaskProgress = useMemo(() => {
    if (!reminder || reminder.subtasks.length === 0) return 0;
    const completed = reminder.subtasks.filter((s) => s.isCompleted).length;
    return (completed / reminder.subtasks.length) * 100;
  }, [reminder]);

  const handleComplete = async () => {
    if (!id) return;
    await completeReminder(id);
  };

  const handleSnooze = async (minutes: number) => {
    if (!id) return;
    await snoozeReminder(id, minutes);
    setShowSnoozeMenu(false);
  };

  const handleSkip = async () => {
    if (!id) return;
    await skipReminder(id);
  };

  const handleTogglePause = async () => {
    if (!id || !reminder) return;
    const newStatus = reminder.status === 'paused' ? 'active' : 'paused';
    await updateReminder(id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteReminder(id);
    navigate('/');
  };

  const startEdit = () => {
    if (!reminder) return;
    setEditName(reminder.name);
    setEditNotes(reminder.notes ?? '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    await updateReminder(id, {
      name: editName.trim(),
      notes: editNotes.trim() || null,
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-6 py-8">
            <LoadingSkeleton count={3} />
          </div>
        </main>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-6 py-8 text-center">
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Reminder not found
            </p>
            <button type="button" onClick={() => navigate('/')} className="btn-primary mt-4">
              Go Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    medium: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    low: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    info: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-soft transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
              aria-label="Go back"
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>

            <div className="flex items-center gap-2">
              {!editing ? (
                <button type="button" onClick={startEdit} className="btn-secondary gap-1.5">
                  <Edit3 size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary gap-1.5"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveEdit} className="btn-primary gap-1.5">
                    <Save size={14} />
                    Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main card */}
          <div className="card p-6 mb-6 animate-slide-up">
            {/* Category + Priority */}
            <div className="flex items-center gap-2 mb-3">
              {category && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </span>
              )}
              <span
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                  priorityColors[reminder.priority],
                )}
              >
                {reminder.priority}
              </span>
              {reminder.status !== 'active' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 capitalize">
                  {reminder.status}
                </span>
              )}
            </div>

            {/* Name */}
            {editing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-field text-xl font-bold mb-3"
              />
            ) : (
              <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                {reminder.name}
              </h1>
            )}

            {/* Description */}
            {reminder.description && (
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {reminder.description}
              </p>
            )}

            {/* Schedule info */}
            <div className="space-y-2 mb-4">
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Clock size={15} />
                <span>{formatScheduleDescription(reminder.schedule)}</span>
              </div>
              {reminder.nextTriggerAt && (
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={clsx('font-medium', overdue ? 'text-red-500' : '')}
                    style={!overdue ? { color: 'var(--text-primary)' } : undefined}
                  >
                    Next: {format(new Date(reminder.nextTriggerAt), 'MMM d, yyyy h:mm a')}{' '}
                    <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>
                      ({formatRelativeTime(reminder.nextTriggerAt)})
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Subtasks — always shown so user can add from detail view */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Subtasks
                </h3>
                {reminder.subtasks.length > 0 && (
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {reminder.subtasks.filter((s) => s.isCompleted).length}/
                    {reminder.subtasks.length}
                  </span>
                )}
              </div>
              {/* Progress bar */}
              {reminder.subtasks.length > 0 && (
                <div
                  className="h-1.5 rounded-full overflow-hidden mb-3"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${subtaskProgress}%`,
                      backgroundColor: subtaskProgress === 100 ? 'var(--success)' : 'var(--accent)',
                    }}
                  />
                </div>
              )}
              {/* Subtask list */}
              {reminder.subtasks.length > 0 && (
                <div className="space-y-0.5 mb-3">
                  {reminder.subtasks.map((sub) => (
                    <SubtaskItem
                      key={sub.id}
                      id={sub.id}
                      title={sub.title}
                      isCompleted={sub.isCompleted}
                      onToggle={(subId, completed) => toggleSubtask(subId, completed)}
                      editable={false}
                    />
                  ))}
                </div>
              )}
              {/* Add subtask input — always visible */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="input-field flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="btn-secondary px-3"
                >
                  <Plus size={16} />
                </button>
              </div>
              {reminder.subtasks.length === 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  No subtasks yet. Add one above.
                </p>
              )}
            </div>

            {/* Notes — always visible, editable inline, auto-saves on blur */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Notes
              </h3>
              <textarea
                value={editing ? editNotes : localNotes}
                onChange={(e) => {
                  if (editing) {
                    setEditNotes(e.target.value);
                  } else {
                    setLocalNotes(e.target.value);
                  }
                }}
                onBlur={() => {
                  if (!editing) handleNotesSave();
                }}
                placeholder="Add notes..."
                rows={3}
                className="input-field resize-none text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          {reminder.status === 'active' && (
            <div className="card p-4 mb-6 animate-slide-up">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completing}
                  className="btn-primary gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  {completing ? 'Completing...' : 'Complete'}
                </button>

                {/* Snooze dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                    className="btn-secondary gap-1.5"
                  >
                    <Clock size={16} />
                    Snooze
                    <ChevronDown size={14} />
                  </button>
                  {showSnoozeMenu && (
                    <div
                      className="absolute top-full left-0 mt-1 py-1 rounded-soft min-w-[140px] z-10"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      {SNOOZE_OPTIONS.map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => handleSnooze(min)}
                          className="w-full text-left px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {min} minutes
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={skipping}
                  className="btn-secondary gap-1.5"
                >
                  <SkipForward size={16} />
                  Skip
                </button>

                <button type="button" onClick={handleTogglePause} className="btn-secondary gap-1.5">
                  <Pause size={16} />
                  Pause
                </button>
              </div>
            </div>
          )}

          {reminder.status === 'paused' && (
            <div className="card p-4 mb-6 animate-slide-up">
              <button type="button" onClick={handleTogglePause} className="btn-primary gap-1.5">
                <Play size={16} />
                Resume
              </button>
            </div>
          )}

          {/* Completion History — each entry is expandable to show subtask snapshot */}
          {reminder.completionHistory.length > 0 && (
            <div className="card p-4 mb-6 animate-slide-up">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                History ({reminder.completionHistory.length})
              </h3>
              <div className="space-y-1">
                {reminder.completionHistory.map((record) => (
                  <HistoryEntry key={record.id} record={record} />
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pt-4 pb-8">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger gap-1.5 w-full"
            >
              <Trash2 size={16} />
              Delete Reminder
            </button>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Reminder"
        message="This action cannot be undone. The reminder and all its data will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

/**
 * Expandable history entry — click to see the subtask snapshot
 * from when the action was taken.
 */
function HistoryEntry({ record }: { record: CompletionRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-soft overflow-hidden transition-all"
      style={{ backgroundColor: expanded ? 'var(--bg-secondary)' : 'transparent' }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 px-2 text-sm hover:opacity-80 transition-opacity"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'capitalize font-medium',
              record.action === 'completed' && 'text-emerald-600',
              record.action === 'skipped' && 'text-amber-600',
              record.action === 'snoozed' && 'text-blue-600',
            )}
          >
            {record.action}
          </span>
          {record.subtaskSnapshot.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              {record.subtaskSnapshot.filter((s) => s.isCompleted).length}/
              {record.subtaskSnapshot.length} subtasks
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
            {format(new Date(record.completedAt), 'MMM d, yyyy h:mm a')}
          </span>
          <ChevronDown
            size={14}
            className={clsx('transition-transform', expanded && 'rotate-180')}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </button>

      {/* Expanded detail: subtask snapshot */}
      {expanded && (
        <div className="px-3 py-2 space-y-1 animate-slide-up">
          {record.scheduledFor && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Scheduled for: {format(new Date(record.scheduledFor), 'MMM d, yyyy h:mm a')}
            </p>
          )}

          {record.subtaskSnapshot.length > 0 ? (
            <>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                Subtasks at time of {record.action}:
              </p>
              {record.subtaskSnapshot.map((s, i) => (
                <div
                  key={s.id || i}
                  className="flex items-center gap-1.5 text-xs pl-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className={s.isCompleted ? 'text-emerald-500' : ''}>
                    {s.isCompleted ? '✓' : '○'}
                  </span>
                  <span className={s.isCompleted ? 'line-through' : ''}>{s.title}</span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              No subtasks recorded for this entry.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
