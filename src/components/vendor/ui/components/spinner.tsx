import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const;

const borderSizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeClasses;
  text?: string;
}

function Spinner({ size = "md", className, text, ...props }: SpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} {...props}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} aria-hidden="true" />
      {text ? <span className="text-muted-foreground">{text}</span> : null}
    </div>
  );
}

function PageSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" text={text} />
    </div>
  );
}

function BorderSpinner({
  size = "md",
  className,
  ...props
}: Omit<SpinnerProps, "text">) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-b-2 border-t-2 border-primary",
        borderSizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

export { Spinner, PageSpinner, BorderSpinner };
