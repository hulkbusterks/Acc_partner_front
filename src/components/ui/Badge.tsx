import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'xp';
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-accent-100 text-accent-700',
  danger: 'bg-danger-50 text-danger-600',
  xp: 'bg-purple-100 text-purple-700',
};

export default function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
