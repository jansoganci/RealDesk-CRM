import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative group inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 appearance-none [-webkit-appearance:none] [-moz-appearance:none] align-middle',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border-2 border-border bg-card text-foreground shadow-sm transition-all hover:bg-muted hover:border-muted-foreground/40 dark:border-border dark:bg-card dark:hover:bg-muted',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90',
        ghost: 'hover:bg-accent/20 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2 md:h-9',
        sm: 'h-10 rounded-md px-3 text-xs md:h-8',
        lg: 'h-12 rounded-md px-8 md:h-10',
        icon: 'min-h-[44px] min-w-[44px] md:h-9 md:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  neon?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, neon: _neon = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="relative inline-flex items-center gap-2">
          {children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

// eslint-disable-next-line react-refresh/only-export-components -- shadcn variants
export { Button, buttonVariants };
