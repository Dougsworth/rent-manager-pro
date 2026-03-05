import { Skeleton, SkeletonStatCard, SkeletonFilterBar, SkeletonRow } from "@/components/ui/skeleton";

export function TenantsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stat Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>

      <SkeletonFilterBar />

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
