import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-sky-500 text-slate-950 shadow',
        secondary: 'border-transparent bg-slate-800 text-slate-300',
        destructive: 'border-transparent bg-rose-500/20 text-rose-300 border-rose-500/30',
        outline: 'border-slate-800 text-slate-300 bg-slate-900/60',
        sky: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
