import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading calendar">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="grid grid-cols-7 border-l border-t border-rule">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[52px] border-b border-r border-rule p-1.5 sm:min-h-[88px]">
            <Skeleton className="h-4 w-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
