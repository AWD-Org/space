import { Skeleton, SkeletonHeader, SkeletonPage, SkeletonPanel } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />
      <div className="grid gap-4">
        <SkeletonPanel className="space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-56 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-[72px] w-full rounded-xl" />
          <div className="flex gap-2.5">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        </SkeletonPanel>
        <SkeletonPanel className="space-y-5">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-full" />
            ))}
          </div>
        </SkeletonPanel>
      </div>
    </SkeletonPage>
  );
}
