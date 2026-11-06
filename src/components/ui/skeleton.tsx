import { cn } from "@/lib/utils";

/** A still block shaped like the content it stands in for. No pulsing. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("bg-secondary", className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-6 w-28" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 border-t border-rule py-3", className)}>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function SkeletonFilterBar({ className }: { className?: string }) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4 border-b border-rule pb-3", className)}>
      <div className="flex gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
      <Skeleton className="hidden h-10 w-56 sm:block" />
    </div>
  );
}
