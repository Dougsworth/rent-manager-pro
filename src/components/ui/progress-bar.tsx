import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("bg-card border border-border rounded-lg p-5", className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{clampedValue}%</p>
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out rounded-full"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}