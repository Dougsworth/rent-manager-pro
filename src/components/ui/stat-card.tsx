import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

const subtextVariants = cva(
  "text-xs font-medium",
  {
    variants: {
      variant: {
        default: "text-slate-500",
        success: "text-slate-900",
        warning: "text-slate-900",
        danger: "text-slate-900",
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
  icon?: LucideIcon;
  accentColor?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  subtextVariant = "default",
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-2xl glass border border-white/60 p-6 transition-all duration-200 hover:shadow-md hover:bg-white/70",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-2">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">{value}</p>
          {subtext && (
            <p className={cn(subtextVariants({ variant: subtextVariant }))}>
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/60 border border-slate-100/80">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
