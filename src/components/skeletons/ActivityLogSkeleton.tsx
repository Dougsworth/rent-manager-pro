import { Skeleton } from "@/components/ui/skeleton";

export function ActivityLogSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mb-6 mt-6 flex gap-5 border-b border-rule pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16" />
        ))}
      </div>
      <Skeleton className="mb-3 h-5 w-24" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[76px_1fr] gap-x-4 border-t border-rule py-3 sm:grid-cols-[96px_1fr]">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}
