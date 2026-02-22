import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const subtextVariants = cva(
  "text-xs font-medium",
  {
    variants: {
      variant: {
        default: "text-gray-500",
        success: "text-emerald-600",
        warning: "text-amber-600",
        danger: "text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatCardProps extends VariantProps<typeof subtextVariants> {
  label: string;
  value: string;
  subtext?: string;
  subtextVariant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  subtextVariant = "default",
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
      className
    )}>
      <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtext && (
        <p className={cn(subtextVariants({ variant: subtextVariant }))}>
          {subtext}
        </p>
      )}
    </div>
  );
}
