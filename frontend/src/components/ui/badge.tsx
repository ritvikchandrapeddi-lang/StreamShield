import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'coral' | 'emerald';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-navy-900 text-white border-transparent',
    secondary: 'bg-navy-100 text-navy-800 border-transparent',
    outline: 'border border-border text-navy-700',
    coral: 'bg-coral-50 text-coral-700 border-coral-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

