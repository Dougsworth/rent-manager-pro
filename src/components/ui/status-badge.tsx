import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        paid: "bg-slate-100 text-slate-700",
        pending: "bg-blue-50 text-blue-700",
        overdue: "bg-slate-900 text-white",
        default: "bg-slate-100 text-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const dotVariants: Record<string, string> = {
  paid: "bg-slate-500",
  pending: "bg-blue-500",
  overdue: "bg-white",
  default: "bg-slate-400",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({
  className,
  variant,
  children,
  ...props
}: StatusBadgeProps) {
  const dotColor = dotVariants[variant ?? "default"] ?? dotVariants.default;
  return (
    <div
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      {children}
    </div>
  );
}

export { StatusBadge };
