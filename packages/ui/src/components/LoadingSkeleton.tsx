import { clsx } from 'clsx';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'line' | 'circle';
}

function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div
            className="h-3 rounded-full w-16 mb-2"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          />
          <div
            className="h-4 rounded-full w-3/4 mb-2"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          />
          <div
            className="h-3 rounded-full w-1/3"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          />
        </div>
      </div>
    </div>
  );
}

function SkeletonLine() {
  return (
    <div className="animate-pulse">
      <div className="h-4 rounded-full w-full" style={{ backgroundColor: 'var(--bg-secondary)' }} />
    </div>
  );
}

function SkeletonCircle() {
  return (
    <div className="animate-pulse">
      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }} />
    </div>
  );
}

export default function LoadingSkeleton({ count = 3, type = 'card' }: LoadingSkeletonProps) {
  const Component =
    type === 'card' ? SkeletonCard : type === 'line' ? SkeletonLine : SkeletonCircle;

  return (
    <div className={clsx('space-y-3', type === 'line' && 'space-y-2')}>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
