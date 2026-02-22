import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        paid: "bg-success-muted text-success",
        pending: "bg-warning-muted text-warning",
        overdue: "bg-destructive-muted text-destructive",
        default: "bg-secondary text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({
  className,
  variant,
  ...props
}: StatusBadgeProps) {
  return (
    <div
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { StatusBadge };