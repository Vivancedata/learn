import * as React from "react";
import { cn } from "../lib/utils";

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
} as const;

const strokeWidths = {
  sm: 4,
  md: 5,
  lg: 6,
  xl: 8,
} as const;

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-xl",
} as const;

export type ProgressCircleSize = keyof typeof sizeClasses;

export interface ProgressCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number;
  size?: ProgressCircleSize;
  showPercentage?: boolean;
}

function ProgressCircle({
  progress,
  size = "md",
  showPercentage = false,
  className,
  ...props
}: ProgressCircleProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const gradientId = React.useId().replace(/:/g, "");

  return (
    <div className={cn("relative group", sizeClasses[size], className)} {...props}>
      {clampedProgress >= 75 ? (
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      ) : null}
      <svg
        viewBox="0 0 100 100"
        className="relative h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <circle
          className="stroke-muted/50"
          fill="none"
          strokeWidth={strokeWidths[size]}
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className={cn(
            "transition-all duration-500 ease-out",
            clampedProgress >= 100 ? "stroke-success" : ""
          )}
          stroke={clampedProgress < 100 ? `url(#${gradientId})` : undefined}
          fill="none"
          strokeWidth={strokeWidths[size]}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx="50"
          cy="50"
          style={{
            filter:
              clampedProgress >= 75
                ? "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))"
                : undefined,
          }}
        />
      </svg>
      {showPercentage ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-semibold tabular-nums transition-colors duration-300",
              textSizes[size],
              clampedProgress >= 100 ? "text-success" : "text-foreground"
            )}
          >
            {Math.round(clampedProgress)}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ProgressCircleSkeleton({ size = "md" }: { size?: ProgressCircleSize }) {
  return <div className={cn("animate-pulse rounded-full bg-muted", sizeClasses[size])} />;
}

export { ProgressCircle, ProgressCircleSkeleton };
