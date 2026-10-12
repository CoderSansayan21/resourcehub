import { Skeleton } from "@/components/ui/skeleton";

export default function ReservationsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-10 w-full max-w-xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </div>
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <Skeleton className="h-10" />
          <Skeleton className="h-10 w-80" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton className="h-64" key={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
