import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
        <div className="flex gap-3 items-end">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </div>
  );
}
