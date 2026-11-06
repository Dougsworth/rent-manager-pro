import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsSkeleton() {
  return (
    <div aria-busy="true">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-10 w-52" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mb-6 mt-6 flex gap-5 border-b border-rule pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16" />
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-rule py-3.5 sm:grid-cols-[120px_1fr]">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
