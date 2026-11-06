import { Skeleton, SkeletonFilterBar } from "@/components/ui/skeleton";

export function InvoicesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading invoices">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="mb-6 h-6 w-full max-w-xl" />
      <SkeletonFilterBar />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-t border-rule py-3.5">
          <Skeleton className="hidden h-4 w-14 lg:block" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="hidden h-4 w-20 lg:block" />
        </div>
      ))}
    </div>
  );
}
