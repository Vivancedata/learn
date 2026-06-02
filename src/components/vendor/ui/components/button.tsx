import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-elevation-1 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-elevation-2 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elevation-1 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-elevation-2 active:translate-y-0",
        outline:
          "border border-border/70 bg-background/80 text-foreground backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary/20 hover:bg-accent/70 hover:text-accent-foreground active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/85 hover:shadow-elevation-1 active:translate-y-0",
        ghost:
          "hover:bg-accent/80 hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        // Neumorphic variants
        neu: "neu-flat bg-background text-foreground hover:shadow-neu-lg active:shadow-neu-inset",
        "neu-primary":
          "neu-flat bg-primary text-primary-foreground hover:shadow-neu-lg active:shadow-neu-inset",
        // Glass variant
        glass:
          "glass text-foreground shadow-elevation-1 hover:-translate-y-0.5 hover:bg-[var(--glass-bg)] hover:shadow-elevation-2 active:translate-y-0",
        // Glow variants
        glow:
          "bg-primary text-primary-foreground shadow-glow hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0",
        // CTA primary variant
        primary: "cta-primary",
        gradient:
          "bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground shadow-elevation-2 shimmer hover:-translate-y-0.5 hover:shadow-elevation-3 active:translate-y-0",
        success:
          "bg-success text-success-foreground shadow-elevation-1 hover:-translate-y-0.5 hover:bg-success/90 hover:shadow-elevation-2 active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        xl: "h-14 rounded-[1.25rem] px-10 text-base sm:text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const content = isLoading ? (
      <>
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading...
      </>
    ) : (
      children
    );

    if (asChild) {
      const SlotComponent = Slot as unknown as React.ElementType;

      return (
        <SlotComponent
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-busy={isLoading || undefined}
          aria-disabled={disabled || isLoading || undefined}
          data-disabled={disabled || isLoading ? "" : undefined}
          {...props}
        >
          {content}
        </SlotComponent>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
