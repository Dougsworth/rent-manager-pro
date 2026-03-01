import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  valueColor?: string;
  subtextColor?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  valueColor = "text-slate-900",
  subtextColor = "text-slate-500",
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl bg-slate-50/60 border border-slate-100 p-5 transition-all duration-200 hover:bg-slate-50",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-3">
            {label}
          </p>
          <p className={cn("text-2xl font-bold tracking-tight mb-1", valueColor)}>{value}</p>
          {subtext && (
            <p className={cn("text-xs font-medium", subtextColor)}>
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
