import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'pill' | 'pill-active';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantClasses = {
      default:
        'bg-[#10B981] hover:bg-[#059669] text-white font-semibold border border-[#10B981] border-b-[3.5px] border-b-gray-950/10 shadow-[0_3px_0_0_#047857,0_4px_12px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[1.5px] active:shadow-[0_1px_0_0_#047857]',
      destructive:
        'bg-rose-500/20 text-rose-300 border border-rose-500/40 border-b-[3px] border-b-rose-900/60 hover:bg-rose-500/30 shadow-[0_2px_0_0_rgba(159,18,57,0.5)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[1px]',
      outline:
        'border border-[var(--border-default)] border-b-[3.5px] border-b-[#07241e] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-green)] hover:border-b-[3.5px] hover:border-b-[#059669] hover:text-[var(--accent-green)] shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[1.5px]',
      secondary:
        'bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-subtle)] border-b-[3px] border-b-[#061e19] shadow-[0_2px_0_0_rgba(0,0,0,0.3)] hover:border-[var(--border-hover)] hover:border-b-[#059669] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[1px]',
      ghost:
        'hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-b hover:border-b-[#10B981]/30 active:translate-y-[1px]',
      link:
        'text-[var(--accent-green)] underline-offset-4 hover:underline',
      pill:
        'rounded-full border border-[var(--border-default)] border-b-[3px] border-b-[#07241e] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:border-b-[#059669] shadow-[0_2px_0_0_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[1px]',
      'pill-active':
        'rounded-full border-2 border-[#10B981] border-b-[3.5px] border-b-[#047857] bg-[#10B981] text-white font-semibold shadow-[0_2px_10px_rgba(16,185,129,0.35)] active:translate-y-[1.5px] active:border-b-[1.5px]',
    };

    const sizeClasses = {
      default: 'h-9 px-4 py-2 text-xs',
      sm: 'h-7 rounded-lg px-2.5 text-[11px]',
      lg: 'h-10 rounded-xl px-6 text-sm',
      icon: 'h-8 w-8 rounded-lg p-0',
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
