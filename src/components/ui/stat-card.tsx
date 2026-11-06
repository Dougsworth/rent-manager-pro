import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  valueColor?: string;
  subtextColor?: string;
  /** Accepted for compatibility. Figures are plain type and show no icon. */
  icon?: LucideIcon;
  className?: string;
}

/** A plain figure: label, value, note. Never a box. */
export function StatCard({ label, value, subtext, valueColor = "text-ink", subtextColor = "text-quiet", className }: StatCardProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[13.5px] text-quiet">{label}</p>
      <p className={cn("num text-xl font-semibold", valueColor)}>{value}</p>
      {subtext && <p className={cn("text-[13.5px]", subtextColor)}>{subtext}</p>}
    </div>
  );
}
