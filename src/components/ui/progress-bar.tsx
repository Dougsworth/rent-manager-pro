import { cn } from "@/lib/utils";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface ProgressBarProps {
  value: number;
  label?: string;
  segments?: Segment[];
  className?: string;
}

export function ProgressBar({ value, label, segments, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  if (segments) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);

    return (
      <div className={cn("rounded-2xl glass border border-white/60 p-6", className)}>
        {label && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-slate-900">{label}</p>
            <p className="text-sm font-semibold text-slate-900">{clampedValue}%</p>
          </div>
        )}
        <div className="w-full bg-slate-100/80 rounded-full h-2 overflow-hidden flex">
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={i}
                className={cn(
                  "h-full transition-all duration-500 ease-out",
                  seg.color,
                  i === 0 && "rounded-l-full",
                  i === segments.length - 1 && "rounded-r-full"
                )}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <span className={cn("w-2 h-2 rounded-full", seg.color)} />
              <span>{seg.label}</span>
              <span className="font-medium text-slate-900">
                {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl glass border border-white/60 p-6", className)}>
      {label && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-sm font-semibold text-slate-900">{clampedValue}%</p>
        </div>
      )}
      <div className="w-full bg-slate-100/80 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
