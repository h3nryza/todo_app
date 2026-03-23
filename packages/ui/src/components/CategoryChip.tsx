import { clsx } from 'clsx';

interface CategoryChipProps {
  name: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function CategoryChip({
  name,
  color,
  selected = false,
  onClick,
  size = 'md',
}: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full transition-all duration-150 border',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        selected
          ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-700'
          : 'border-transparent',
        onClick && 'cursor-pointer hover:opacity-80',
      )}
      style={!selected ? { backgroundColor: 'var(--bg-secondary)' } : undefined}
    >
      <span
        className={clsx('rounded-full flex-shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')}
        style={{ backgroundColor: color }}
      />
      <span style={{ color: 'var(--text-primary)' }} className="font-medium">
        {name}
      </span>
    </button>
  );
}
