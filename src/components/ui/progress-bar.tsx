import { cn } from "@/lib/utils";

interface Segment {
  label: string;
  value: number;
  /** A background class, for example `bg-paid` or `hatch-late`. */
  color: string;
}

interface ProgressBarProps {
  value: number;
  label?: string;
  segments?: Segment[];
  className?: string;
}

/** A thin flat bar on a hairline track, with its words beside it. */
export function ProgressBar({ value, label, segments, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  if (segments) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    return (
      <div className={cn("min-w-0", className)}>
        {label && (
          <p className="mb-2 flex items-baseline justify-between gap-4 text-[15px]">
            <span>{label}</span>
            <span className="num font-semibold">{clampedValue}%</span>
          </p>
        )}
        <div className="flex h-2 w-full gap-px bg-rule">
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0;
            if (pct === 0) return null;
            return <div key={i} className={cn("h-full", seg.color)} style={{ width: `${pct}%` }} />;
          })}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-quiet">
          {segments.map((seg, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("h-3 w-1.5", seg.color)} />
              {seg.label}
            </span>
          ))}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <p className="mb-2 flex items-baseline justify-between gap-4 text-[15px]">
          <span>{label}</span>
          <span className="num font-semibold">{clampedValue}%</span>
        </p>
      )}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-[3px] w-full bg-rule"
      >
        <div className="h-full bg-paid" style={{ width: `${clampedValue}%` }} />
      </div>
    </div>
  );
}
