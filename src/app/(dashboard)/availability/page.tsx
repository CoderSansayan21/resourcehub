import Image from "next/image";
import { AvailabilityTimeline } from "@/components/availability-timeline";
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
      <section className="relative isolate min-h-[290px] overflow-hidden rounded-[1.75rem] bg-[#063B3A] shadow-xl shadow-teal-950/10 sm:min-h-[320px]">
        <Image
          alt="A bright workplace with flexible shared resources"
          className="object-cover object-center"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1100px"
          src="/images/availability/availability-hero.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#063B3A]/95 via-[#063B3A]/72 to-[#063B3A]/15" />
        <div className="relative flex min-h-[290px] max-w-2xl flex-col justify-center px-6 py-10 text-white sm:min-h-[320px] sm:px-10 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#BDEFE5]">
            Availability
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
            Inspect availability before booking
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            Choose a resource and date to see confirmed reservation blocks and open intervals before starting a booking.
          </p>
        </div>
      </section>

      <AvailabilityTimeline
        initialDate={getValidDateParam(params.date)}
        initialResourceId={Array.isArray(params.resourceId) ? params.resourceId[0] : params.resourceId}
        resources={resources}
      />
    </div>
  );
}
