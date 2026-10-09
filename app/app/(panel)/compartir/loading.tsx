import { Skeleton, SkeletonHeader, SkeletonPage, SkeletonPanel } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeader />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonPanel className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        </SkeletonPanel>
        <SkeletonPanel className="space-y-4">
          <Skeleton className="mx-auto aspect-square w-full max-w-[240px] rounded-xl" />
          <Skeleton className="mx-auto h-11 w-40 rounded-full" />
        </SkeletonPanel>
      </div>
    </SkeletonPage>
  );
}
