import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

/**
 * Spinner component for loading states
 *
 * @param size - Size variant: sm, md, or lg (default: md)
 * @param className - Additional CSS classes
 * @param text - Optional loading text to display next to spinner
 */
export function Spinner({ size = "md", className, text }: SpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeMap[size])} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  )
}

/**
 * Full-page spinner for loading states
 *
 * @param text - Optional loading text (default: "Loading...")
 */
export function PageSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" text={text} />
    </div>
  )
}

/**
 * Simple spinner div without Loader2 icon (for full-page loading states)
 * Uses border animation style
 */
export function BorderSpinner({ size = "md", className }: Omit<SpinnerProps, "text">) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-2 border-b-2 border-primary",
        sizeClasses[size],
        className
      )}
    />
  )
}
