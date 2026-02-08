interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className="bg-transparent p-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{label || "Progress"}</p>
        <p className="text-sm font-semibold text-blue-600">{percentage}%</p>
      </div>
      <div className="h-3 bg-blue-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
