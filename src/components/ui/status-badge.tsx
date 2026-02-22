import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
        pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
        overdue: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
        default: "bg-gray-50 text-gray-600 ring-1 ring-gray-500/20",
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
