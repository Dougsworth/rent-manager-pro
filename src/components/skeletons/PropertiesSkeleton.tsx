import { Skeleton } from "@/components/ui/skeleton";

/** Shaped like the Properties page: title, one sentence, then each property with its unit rows. */
export function PropertiesSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="hidden h-10 w-32 sm:block" />
      </div>
      <Skeleton className="mb-8 h-5 w-96 max-w-full" />
      <div className="space-y-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div className="space-y-2 pb-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3.5 w-72 max-w-full" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between gap-4 border-t border-rule py-3.5">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
