import { Skeleton } from "@/components/ui/skeleton";

/** Shaped like the Tenants page: title, one sentence, tabs, then rule separated rows. */
export function TenantsSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-28 sm:block" />
      </div>
      <Skeleton className="mb-6 h-5 w-80 max-w-full" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-11 w-64" />
        <Skeleton className="h-10 w-full sm:w-64" />
      </div>
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 border-t border-rule py-3.5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
