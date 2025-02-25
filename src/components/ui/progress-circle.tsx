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
    lg: "h-20 w-20"
  }

  const strokeWidths = {
    sm: 4,
    md: 5,
    lg: 6
  }

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg className="h-full w-full -rotate-90">
        {/* Background circle */}
        <circle
          className="stroke-muted"
          fill="none"
          strokeWidth={strokeWidths[size]}
          r={radius}
          cx="50%"
          cy="50%"
        />
        {/* Progress circle */}
        <circle
          className="stroke-primary transition-all duration-300 ease-in-out"
          fill="none"
          strokeWidth={strokeWidths[size]}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx="50%"
          cy="50%"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  )
}

export function ProgressCircleSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20"
  }

  return (
    <div className={cn("animate-pulse rounded-full bg-muted", sizes[size])} />
  )
}
