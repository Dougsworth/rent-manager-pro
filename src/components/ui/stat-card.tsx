import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  subtextVariant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({ label, value, subtext, subtextVariant = "default" }: StatCardProps) {
  const subtextColors = {
    default: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-blue-300 transition-all duration-200 group">
      <p className="text-xs uppercase font-medium tracking-wide text-blue-600 mb-2 group-hover:text-blue-700">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
      <p className={cn("text-sm", subtextColors[subtextVariant])}>{subtext}</p>
    </div>
  );
}
