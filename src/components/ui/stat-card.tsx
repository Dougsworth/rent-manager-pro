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
    <div className="bg-card border border-border rounded-lg p-5">
      <p className="text-xs uppercase font-medium tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground mb-1">{value}</p>
      <p className={cn("text-xs", subtextColors[subtextVariant])}>{subtext}</p>
    </div>
  );
}
