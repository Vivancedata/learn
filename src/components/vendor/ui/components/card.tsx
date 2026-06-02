import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const cardVariants = cva(
  "rounded-[calc(var(--radius)+0.25rem)] border text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "border-border/70 bg-card/92 shadow-elevation-1 backdrop-blur-sm hover:-translate-y-1 hover:shadow-elevation-2",
        outline: "border-border/70 bg-background/70 backdrop-blur-sm",
        ghost: "border-transparent bg-transparent shadow-none",
        // Neumorphic variants
        neu: "neu-flat border-transparent",
        "neu-inset": "neu-concave border-transparent",
        // Glass variant
        glass:
          "glass-card border-[var(--glass-border)] shadow-elevation-1 hover:-translate-y-1 hover:shadow-elevation-2",
        // Elevated with glow on hover
        elevated:
          "bg-card shadow-elevation-2 hover:-translate-y-1 hover:shadow-elevation-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

type CardTitleLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: CardTitleLevel;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", ...props }, ref) => {
    const Heading = Component as React.ElementType;

    return (
      <Heading
        ref={ref}
        className={cn(
          "text-xl font-semibold leading-tight tracking-tight sm:text-2xl",
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
