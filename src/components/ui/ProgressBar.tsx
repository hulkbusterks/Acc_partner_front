import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  variant?: 'brand' | 'success' | 'danger' | 'xp';
  className?: string;
  showLabel?: boolean;
}

const barVariants: Record<string, string> = {
  brand: 'bg-brand-500',
  success: 'bg-success-500',
  danger: 'bg-danger-500',
  xp: 'bg-xp',
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  variant = 'brand',
  className,
  showLabel = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            barVariants[variant],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
