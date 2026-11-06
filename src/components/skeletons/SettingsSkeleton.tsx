import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-6 h-10 w-40" />
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-11">
        <div className="hidden space-y-3 border-t border-rule pt-3 lg:block">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-32" />
          ))}
        </div>
        <div className="max-w-[680px] border-t border-rule pt-5">
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="mb-6 h-4 w-72" />
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
