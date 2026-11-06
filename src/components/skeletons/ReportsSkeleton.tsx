import { Skeleton } from "@/components/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading report">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-b border-rule pb-5">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="mt-6 h-8 w-full max-w-2xl" />
      <Skeleton className="mt-8 h-4 w-40" />
      <Skeleton className="mt-4 h-64 w-full" />
    </div>
  );
}
