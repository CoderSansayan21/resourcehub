import { Skeleton } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-10 w-full max-w-2xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-3xl" />
      </div>
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Skeleton className="h-10" />
          <Skeleton className="h-10 w-72" />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-44" />
      </div>
    </div>
  );
}
