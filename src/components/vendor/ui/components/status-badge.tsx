import * as React from "react";
import { AlertTriangle, CheckCircle, Clock, Info, XCircle } from "lucide-react";
import { Badge, type BadgeProps } from "./badge";
import { cn } from "../lib/utils";

export type StatusType = "success" | "error" | "warning" | "pending" | "info";

export interface StatusBadgeProps extends Omit<BadgeProps, "icon"> {
  status: StatusType;
  showIcon?: boolean;
}

const statusConfig: Record<
  StatusType,
  {
    className: string;
    icon: React.ComponentType<React.ComponentProps<"svg">>;
    defaultText: string;
  }
> = {
  success: {
    className: "border-success bg-success/10 text-success",
    icon: CheckCircle,
    defaultText: "Success",
  },
  error: {
    className: "border-destructive bg-destructive/10 text-destructive",
    icon: XCircle,
    defaultText: "Error",
  },
  warning: {
    className: "border-warning bg-warning/10 text-warning",
    icon: AlertTriangle,
    defaultText: "Warning",
  },
  pending: {
    className: "border-warning bg-warning/10 text-warning",
    icon: Clock,
    defaultText: "Pending",
  },
  info: {
    className: "border-info bg-info/10 text-info",
    icon: Info,
    defaultText: "Info",
  },
};

function StatusBadge({
  status,
  children,
  showIcon = true,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
      icon={showIcon ? <Icon className="h-3 w-3" /> : undefined}
      {...props}
    >
      {children ?? config.defaultText}
    </Badge>
  );
}

export { StatusBadge };
