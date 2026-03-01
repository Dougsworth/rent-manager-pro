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
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-blue-600">{clampedValue}%</p>
          </div>
        )}
        {/* Segmented bar like the mockup */}
        <div className="w-full flex gap-1 mb-4">
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0;
            if (pct === 0) return null;
            const count = Math.max(1, Math.round(pct / 4));
            return Array.from({ length: count }).map((_, j) => (
              <div
                key={`${i}-${j}`}
                className={cn("h-3 flex-1 rounded-sm transition-all duration-500", seg.color)}
              />
            ));
          })}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
              <span className={cn("w-2.5 h-2.5 rounded-full", seg.color)} />
              <span>{seg.label}</span>
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
