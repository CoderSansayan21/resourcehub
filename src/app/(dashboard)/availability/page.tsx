import { AvailabilityTimeline } from "@/components/availability-timeline";
import { PageHeading } from "@/components/ui/page-heading";
import { listResourcesForCurrentUser } from "@/lib/resources";

export const instant = false;

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

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[]; resourceId?: string | string[] }>;
}) {
  const [resources, params] = await Promise.all([
    listResourcesForCurrentUser(),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeading
        description="Choose a resource and date to see confirmed reservation blocks and open intervals before starting a booking."
        eyebrow="Availability"
        title="Inspect availability before booking"
      />

      <AvailabilityTimeline
        initialDate={getValidDateParam(params.date)}
        initialResourceId={Array.isArray(params.resourceId) ? params.resourceId[0] : params.resourceId}
        resources={resources}
      />
    </div>
  );
}
