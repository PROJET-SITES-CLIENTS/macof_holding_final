import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'luxury' | 'primary' | 'secondary' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      // --- Variantes site public (inchangées, + ring focus or) ---
      default:
        'bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-[#cda434]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
      outline:
        'border border-black/20 text-foreground hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-[#cda434]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
      ghost:
        'hover:bg-black/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-[#cda434]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
      luxury:
        'bg-primary text-primary-foreground uppercase tracking-[0.2em] font-medium shadow-[0_0_20px_rgba(0,85,164,0.15)] hover:shadow-[0_0_30px_rgba(0,85,164,0.3)] hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-[#cda434]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
      // --- Variantes admin premium (or MACOF) ---
      primary:
        'rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-[#1a1405] font-semibold shadow-[0_8px_24px_-8px_rgba(205,164,52,0.55)] hover:shadow-[0_10px_28px_-6px_rgba(205,164,52,0.65)] hover:brightness-105 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#cda434]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
      secondary:
        'rounded-xl border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] hover:border-white/20 hover:text-white active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#cda434]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
      danger:
        'rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)] hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]',
    };

    const sizes = {
      default: 'h-12 px-6 py-2',
      sm: 'h-10 px-4 text-xs',
      lg: 'h-14 px-10 text-sm tracking-[0.2em]',
      icon: 'h-12 w-12',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-xs font-sans transition-all duration-300 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
