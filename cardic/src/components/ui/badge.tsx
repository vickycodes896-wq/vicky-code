import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'emerald' | 'destructive' | 'warning' | 'cyan';
}

function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variantClasses = {
    default:
      'border-transparent bg-[var(--accent-green)] text-white shadow hover:opacity-90',
    secondary:
      'border-transparent bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    destructive:
      'border-transparent bg-rose-500/15 text-rose-400 border border-rose-500/30',
    warning:
      'border-transparent bg-amber-500/15 text-amber-400 border border-amber-500/30',
    emerald:
      'border-transparent bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cyan:
      'border-transparent bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    outline:
      'border-[var(--border-default)] text-[var(--text-secondary)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
