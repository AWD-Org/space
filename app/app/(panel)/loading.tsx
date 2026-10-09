import { Skeleton, SkeletonPage, SkeletonPanel } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="mb-6 space-y-2.5">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid gap-4">
        <SkeletonPanel>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-6 w-72 max-w-full" />
            </div>
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-[72px] w-full rounded-xl" />
        </SkeletonPanel>
        <SkeletonPanel>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-2 h-4 w-28" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-48 max-w-[70%]" />
              </div>
            ))}
          </div>
        </SkeletonPanel>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonPanel>
            <Skeleton className="h-5 w-32" />
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="mt-5 h-24 w-full" />
          </SkeletonPanel>
          <SkeletonPanel>
            <Skeleton className="h-5 w-28" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-40 max-w-[60%]" />
                </div>
              ))}
            </div>
          </SkeletonPanel>
        </div>
      </div>
    </SkeletonPage>
  );
}
