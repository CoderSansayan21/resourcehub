import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResourceDetailsLoading() {
  return (
    <div className="space-y-6">
      <ButtonLink href="/resources" variant="secondary">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to resources
      </ButtonLink>
      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="p-6 sm:p-7">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-10 w-full max-w-xl" />
          <Skeleton className="mt-6 h-24 w-full" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </section>
    </div>
  );
}
