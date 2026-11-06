import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading what's owed">
      <Skeleton className="h-5 w-52" />
      <Skeleton className="mt-2 h-14 w-full max-w-2xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      <div className="mt-10 space-y-5">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    </div>
  );
}
