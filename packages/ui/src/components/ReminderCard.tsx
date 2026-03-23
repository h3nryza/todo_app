import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, SkipForward, AlarmClock } from 'lucide-react';
import { clsx } from 'clsx';
import type { Reminder, Category } from '@ohright/shared';
import { formatRelativeTime, isOverdue, SNOOZE_OPTIONS } from '@ohright/shared';
import { format, isToday } from 'date-fns';
import { completeReminder, snoozeReminder, skipReminder } from '@/services/reminders.service';

interface ReminderCardProps {
  reminder: Reminder;
  category?: Category;
}

const priorityBorderColors: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-indigo-500',
  low: 'border-l-amber-400',
  info: 'border-l-gray-400',
};

export default function ReminderCard({ reminder, category }: ReminderCardProps) {
  const navigate = useNavigate();
  const overdue = reminder.nextTriggerAt ? isOverdue(reminder.nextTriggerAt) : false;
  const dueToday = reminder.nextTriggerAt ? isToday(new Date(reminder.nextTriggerAt)) : false;
  const [showSnooze, setShowSnooze] = useState(false);
  const [acting, setActing] = useState(false);

  const completedSubtasks = reminder.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = reminder.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  /** Quick complete from card — stops propagation so we don't navigate */
  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActing(true);
    try {
      await completeReminder(reminder.id);
    } catch {
      /* handled by service */
    }
    setActing(false);
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActing(true);
    try {
      await skipReminder(reminder.id);
    } catch {
      /* handled */
    }
    setActing(false);
  };

  const handleSnooze = async (e: React.MouseEvent, minutes: number) => {
    e.stopPropagation();
    setShowSnooze(false);
    setActing(true);
    try {
      await snoozeReminder(reminder.id, minutes);
    } catch {
      /* handled */
    }
    setActing(false);
  };

  return (
    <div
      className={clsx(
        'card-hover w-full text-left p-4 border-l-4 animate-slide-up cursor-pointer group relative',
        priorityBorderColors[reminder.priority] ?? 'border-l-indigo-500',
        overdue && 'ring-2 ring-red-400 ring-opacity-50',
        dueToday && !overdue && 'ring-2 ring-amber-400 ring-opacity-50',
        acting && 'opacity-60 pointer-events-none',
      )}
      onClick={() => navigate(`/reminders/${reminder.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/reminders/${reminder.id}`);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category chip */}
          {category && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {category.name}
              </span>
            </div>
          )}

          {/* Reminder name */}
          <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {reminder.name}
          </h3>

          {/* Time info */}
          {reminder.nextTriggerAt && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock
                size={13}
                className={clsx(
                  overdue ? 'text-red-500' : dueToday ? 'text-amber-500' : 'text-gray-400',
                )}
              />
              <span
                className={clsx(
                  'text-xs',
                  overdue
                    ? 'text-red-500 font-medium'
                    : dueToday
                      ? 'text-amber-500 font-medium'
                      : '',
                )}
                style={!overdue && !dueToday ? { color: 'var(--text-secondary)' } : undefined}
              >
                {overdue
                  ? `Overdue - ${formatRelativeTime(reminder.nextTriggerAt)}`
                  : dueToday
                    ? `Today at ${format(new Date(reminder.nextTriggerAt), 'h:mm a')}`
                    : formatRelativeTime(reminder.nextTriggerAt)}
              </span>
            </div>
          )}

          {/* Subtask progress */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
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
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}
        </div>

        {/* Quick action buttons — visible on hover */}
        {reminder.status === 'active' && (
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Complete */}
            <button
              type="button"
              onClick={handleComplete}
              className="p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
              title="Complete"
            >
              <CheckCircle2 size={16} className="text-emerald-500" />
            </button>

            {/* Snooze */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSnooze(!showSnooze);
                }}
                className="p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                title="Snooze"
              >
                <AlarmClock size={16} className="text-blue-500" />
              </button>
              {showSnooze && (
                <div
                  className="absolute top-full right-0 mt-1 py-1 rounded-soft min-w-[120px] z-20"
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
                      onClick={(e) => handleSnooze(e, min)}
                      className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Skip */}
            <button
              type="button"
              onClick={handleSkip}
              className="p-1.5 rounded-full hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
              title="Skip"
            >
              <SkipForward size={16} className="text-amber-500" />
            </button>
          </div>
        )}

        {/* Status indicator for completed */}
        {reminder.status === 'completed' && (
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
        )}
      </div>
    </div>
  );
}
