import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export type StatusType = "success" | "error" | "warning" | "pending" | "info"

interface StatusBadgeProps {
  status: StatusType
  children?: React.ReactNode
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  success: {
    className: "bg-success/10 text-success border-success",
    icon: CheckCircle,
    defaultText: "Success",
  },
  error: {
    className: "bg-destructive/10 text-destructive border-destructive",
    icon: XCircle,
    defaultText: "Error",
  },
  warning: {
    className: "bg-warning/10 text-warning border-warning",
    icon: AlertTriangle,
    defaultText: "Warning",
  },
  pending: {
    className: "bg-warning/10 text-warning border-warning",
    icon: Clock,
    defaultText: "Pending",
  },
  info: {
    className: "bg-info/10 text-info border-info",
    icon: CheckCircle,
    defaultText: "Info",
  },
}

/**
 * StatusBadge component for displaying status indicators with semantic colors
 *
 * @param status - The status type: success, error, warning, pending, or info
 * @param children - Custom content to display (overrides default text)
 * @param showIcon - Whether to show the status icon (default: true)
 * @param className - Additional CSS classes
 *
 * @example
 * <StatusBadge status="success" />
 * <StatusBadge status="error">Failed</StatusBadge>
 * <StatusBadge status="pending" showIcon={false}>In Review</StatusBadge>
 */
export function StatusBadge({
  status,
  children,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {children || config.defaultText}
    </Badge>
  )
}
