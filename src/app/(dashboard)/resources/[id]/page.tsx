import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Info,
  MapPin,
  PackageSearch,
  UsersRound,
} from "lucide-react";
import { ReservationBookingForm } from "@/components/reservation-booking-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/authorization";
import {
  getResourceDetails,
  ResourceOperationError,
  type ResourceDto,
} from "@/lib/resources";
import { cn } from "@/lib/utils";

export const instant = false;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getValidDateParam(value: string | string[] | undefined) {
  const date = Array.isArray(value) ? value[0] : value;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return undefined;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function StatusBadge({ resource }: { resource: ResourceDto }) {
  return (
    <Badge
      className={cn(
        "gap-1.5",
        resource.isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600",
      )}
      variant={resource.isActive ? "green" : "slate"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          resource.isActive ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {resource.isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function ResourceUnavailable() {
  return (
    <div className="space-y-6">
      <ButtonLink href="/resources" variant="secondary">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to resources
      </ButtonLink>
      <EmptyState
        action={
          <ButtonLink href="/resources" variant="secondary">
            Browse available resources
          </ButtonLink>
        }
        description="This resource does not exist or is no longer visible in the member catalog."
        icon={PackageSearch}
        title="Resource unavailable"
      />
    </div>
  );
}

export default async function ResourceDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  await requireUser();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const initialBookingDate = getValidDateParam(query.date);

  let resource: ResourceDto;

  try {
    resource = await getResourceDetails(id);
  } catch (error) {
    if (error instanceof ResourceOperationError && error.status === 404) {
      return <ResourceUnavailable />;
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-700 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        href="/resources"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to resources
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
                {resource.type}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {resource.name}
              </h1>
            </div>
            <StatusBadge resource={resource} />
          </div>

          <p className="mt-6 max-w-3xl text-base leading-7 text-muted">
            {resource.description ??
              "No description has been added for this resource yet."}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted">
                <MapPin aria-hidden="true" className="size-4" />
                Location
              </dt>
              <dd className="mt-2 text-base font-semibold text-slate-950">
                {resource.location ?? "Not specified"}
              </dd>
            </div>
            <div className="rounded-md border border-border bg-slate-50 p-4">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted">
                <UsersRound aria-hidden="true" className="size-4" />
                Capacity
              </dt>
              <dd className="mt-2 text-base font-semibold text-slate-950">
                {resource.capacity
                  ? `${resource.capacity} ${
                      resource.capacity === 1 ? "person" : "people"
                    }`
                  : "Not specified"}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#E6F2F0] text-primary">
                  <CalendarClock aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Reserve this resource
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Request a confirmed booking. The server checks resource
                    visibility and protected overlap rules before confirming.
                  </p>
                </div>
              </div>
            </CardHeader>
            <ReservationBookingForm
              initialDate={initialBookingDate}
              resource={resource}
            />
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  <Info aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Catalog record
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Created {formatDate(resource.createdAt)}. Last updated{" "}
                    {formatDate(resource.updatedAt)}.
                  </p>
                </div>
              </div>
            </CardHeader>
            {resource.isActive ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Visible in the member catalog
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Inactive resources are hidden from members. Management actions
                remain in Administration.
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
