import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'coral';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-navy-900 text-white hover:bg-navy-800 shadow-sm',
      secondary: 'bg-navy-100 text-navy-900 hover:bg-navy-200',
      outline: 'border border-border bg-surface hover:bg-surface-subtle text-navy-800',
      ghost: 'hover:bg-surface-subtle text-navy-700',
      coral: 'bg-coral-500 text-white hover:bg-coral-600 shadow-sm',
    };

    const sizeStyles = {
      default: 'h-9 px-4 py-2 text-xs font-medium',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-10 px-5 text-sm',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coral-500 disabled:pointer-events-none disabled:opacity-50 select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

