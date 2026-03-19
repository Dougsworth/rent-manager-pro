import { Skeleton, SkeletonFilterBar, SkeletonRow } from "@/components/ui/skeleton";

export function ActivityLogSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <SkeletonFilterBar />

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
