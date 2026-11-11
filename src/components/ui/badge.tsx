import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-black text-white shadow',
        secondary: 'border-transparent bg-gray-100 text-gray-700',
        destructive: 'border-transparent bg-rose-500/20 text-rose-700 border-rose-500/30',
        outline: 'border-gray-200 text-gray-700 bg-white/60',
        sky: 'border-gray-300 bg-gray-100 text-black',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700'
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
