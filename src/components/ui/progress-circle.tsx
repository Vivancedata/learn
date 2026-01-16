import { cn } from "@/lib/utils"
import { ProgressCircleProps } from "@/types/ui"

export function ProgressCircle({
  progress,
  size = "md",
  showPercentage = false,
  className
}: ProgressCircleProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
    xl: "h-28 w-28"
  }

  const strokeWidths = {
    sm: 4,
    md: 5,
    lg: 6,
    xl: 8
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-xl"
  }

  return (
    <div className={cn("relative group", sizes[size], className)}>
      {/* Glow effect for high progress */}
      {progress >= 75 && (
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <svg className="h-full w-full -rotate-90 relative">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          className="stroke-muted/50"
          fill="none"
          strokeWidth={strokeWidths[size]}
          r={radius}
          cx="50%"
          cy="50%"
        />
        {/* Progress circle with gradient */}
        <circle
          className={cn(
            "transition-all duration-500 ease-out",
            progress >= 100 ? "stroke-success" : ""
          )}
          stroke={progress < 100 ? "url(#progressGradient)" : undefined}
          fill="none"
          strokeWidth={strokeWidths[size]}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx="50%"
          cy="50%"
          style={{
            filter: progress >= 75 ? "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" : undefined
          }}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-semibold tabular-nums transition-colors duration-300",
            textSizes[size],
            progress >= 100 ? "text-success" : "text-foreground"
          )}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
}

export function ProgressCircleSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
    xl: "h-28 w-28"
  }

  return (
    <div className={cn("animate-pulse rounded-full bg-muted", sizes[size])} />
  )
}
