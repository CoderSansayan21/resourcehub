import { Skeleton } from "@/components/ui/skeleton";

export default function ResourcesLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-10 w-full max-w-xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </div>
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Skeleton className="h-56" key={item} />
        ))}
      </div>
    </div>
  );
}
