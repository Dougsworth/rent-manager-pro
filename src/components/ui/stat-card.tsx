import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const subtextVariants = cva(
  "text-xs",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        success: "text-success",
        warning: "text-warning",
        danger: "text-destructive",
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
    <div className={cn("bg-card border border-border rounded-lg p-5", className)}>
      <p className="text-xs uppercase text-muted-foreground font-medium tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      {subtext && (
        <p className={cn(subtextVariants({ variant: subtextVariant }))}>
          {subtext}
        </p>
      )}
    </div>
  );
}