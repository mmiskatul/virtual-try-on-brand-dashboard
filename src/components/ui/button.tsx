import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-black text-white font-bold hover:bg-gray-800 shadow-lg shadow-black/10',
        destructive: 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20',
        outline: 'border border-gray-200 bg-white/60 text-gray-800 hover:bg-gray-100 hover:text-black hover:border-gray-300',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100/60 hover:text-black text-gray-500',
        link: 'text-black underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-12 rounded-2xl px-6 text-sm',
        icon: 'h-9 w-9 p-0 rounded-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
