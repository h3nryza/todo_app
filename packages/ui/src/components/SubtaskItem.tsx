import { useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SubtaskItemProps {
  id: string;
  title: string;
  isCompleted: boolean;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export default function SubtaskItem({
  id,
  title,
  isCompleted,
  onToggle,
  onDelete,
  editable = true,
}: SubtaskItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group flex items-center gap-3 py-1.5 px-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => onToggle(id, !isCompleted)}
        className={clsx(
          'w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-150',
          isCompleted
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-gray-300 dark:border-gray-500 hover:border-indigo-400',
        )}
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {isCompleted && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <span
        className={clsx(
          'flex-1 text-sm transition-all duration-150',
          isCompleted && 'line-through',
        )}
        style={{ color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)' }}
      >
        {title}
      </span>

      {editable && onDelete && hovered && (
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          aria-label="Delete subtask"
        >
          <X size={14} className="text-red-400" />
        </button>
      )}
    </div>
  );
}
