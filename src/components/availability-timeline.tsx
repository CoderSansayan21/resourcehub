"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type Resource = {
  capacity: number | null;
  createdAt: string;
  description: string | null;
  id: string;
  isActive: boolean;
  location: string | null;
  name: string;
  type: string;
  updatedAt: string;
};

type AvailabilityInterval = {
  endTime: string;
  startTime: string;
};

type Availability = {
  date: string;
  dayEnd: string;
  dayStart: string;
  free: AvailabilityInterval[];
  occupied: AvailabilityInterval[];
  resource: {
    id: string;
    isActive: boolean;
    location: string | null;
    name: string;
    type: string;
  };
  timeZone: string;
};

type AvailabilityResponse = {
  availability?: Availability;
  error?: { message?: string };
};

const RESOURCEHUB_TIME_ZONE = "Asia/Colombo";

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    day: lookup.day,
    month: lookup.month,
    year: lookup.year,
  };
}

function getTodayDate() {
  const { day, month, year } = getDatePartsInTimeZone(
    new Date(),
    RESOURCEHUB_TIME_ZONE,
  );

  return `${year}-${month}-${day}`;
}

function addDays(dateValue: string, amount: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function getTimeZoneLabel(timeZone: string) {
  const offset = new Intl.DateTimeFormat("en", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")?.value;

  return `${timeZone}${offset ? ` (${offset})` : ""}`;
}

function formatDate(dateValue: string, timeZone: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function intervalLabel(interval: AvailabilityInterval, timeZone: string) {
  return `${formatTime(interval.startTime, timeZone)} - ${formatTime(
    interval.endTime,
    timeZone,
  )}`;
}

function durationLabel(interval: AvailabilityInterval) {
  const minutes = Math.round(
    (new Date(interval.endTime).getTime() -
      new Date(interval.startTime).getTime()) /
      60000,
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

function percentWithinDay(value: string, availability: Availability) {
  const dayStart = new Date(availability.dayStart).getTime();
  const dayEnd = new Date(availability.dayEnd).getTime();
  const current = new Date(value).getTime();

  return ((current - dayStart) / (dayEnd - dayStart)) * 100;
}

function hourMarkers(availability: Availability) {
  const start = new Date(availability.dayStart).getTime();
  const end = new Date(availability.dayEnd).getTime();
  const duration = end - start;
  const markers = [];

  for (let index = 0; index <= 6; index += 1) {
    const instant = new Date(start + (duration * index) / 6).toISOString();
    markers.push({
      label: formatTime(instant, availability.timeZone),
      left: `${(index / 6) * 100}%`,
    });
  }

  return markers;
}

export function AvailabilityTimeline({
  initialDate,
  initialResourceId,
  resources,
}: {
  initialDate?: string;
  initialResourceId?: string;
  resources: Resource[];
}) {
  const [resourceId, setResourceId] = useState(
    initialResourceId && resources.some((resource) => resource.id === initialResourceId)
      ? initialResourceId
      : resources[0]?.id ?? "",
  );
  const [date, setDate] = useState(initialDate ?? getTodayDate);
  const [timeZone] = useState(RESOURCEHUB_TIME_ZONE);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedResource = resources.find((resource) => resource.id === resourceId);

  const replaceAvailabilityUrl = useCallback(
    (nextResourceId: string, nextDate: string) => {
      const params = new URLSearchParams();

      if (nextResourceId) params.set("resourceId", nextResourceId);
      if (nextDate) params.set("date", nextDate);

      router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const updateResourceId = useCallback(
    (nextResourceId: string) => {
      setResourceId(nextResourceId);
      replaceAvailabilityUrl(nextResourceId, date);
    },
    [date, replaceAvailabilityUrl],
  );

  const updateDate = useCallback(
    (nextDate: string) => {
      setDate(nextDate);
      replaceAvailabilityUrl(resourceId, nextDate);
    },
    [replaceAvailabilityUrl, resourceId],
  );

  const loadAvailability = useCallback(async () => {
    if (!resourceId || !date || !timeZone) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ date, resourceId, timeZone });
      const response = await fetch(`/api/availability?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | AvailabilityResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Availability could not be loaded.");
      }

      setAvailability(data?.availability ?? null);
    } catch (requestError) {
      setAvailability(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Availability could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [date, resourceId, timeZone]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAvailability();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAvailability]);

  const markers = useMemo(
    () => (availability ? hourMarkers(availability) : []),
    [availability],
  );

  if (resources.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#B5D2CE] bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-10">
        <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
          <Image
            alt="Empty availability calendar"
            className="h-auto w-48 object-contain sm:w-60"
            height={512}
            src="/images/availability/availability-empty.png"
            width={512}
          />
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#102D2C]">
            No resources available
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            No active resources are available for availability lookup yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="availability-title">
      <Card className="rounded-2xl border-slate-200/90 p-5 shadow-sm shadow-slate-200/70 sm:p-6">
        <CardHeader className="mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F3] text-[#087F73]">
                <CalendarDays aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2
                  className="text-xl font-bold tracking-tight text-[#102D2C]"
                  id="availability-title"
                >
                  Check resource availability
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Select a resource and date to inspect confirmed booking blocks before you reserve.
                </p>
              </div>
            </div>
            {selectedResource ? (
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#087F73] px-4 text-sm font-semibold text-white shadow-sm shadow-teal-950/10 transition hover:bg-[#066B62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]"
                href={`/resources/${selectedResource.id}?date=${date}`}
              >
                <CalendarDays aria-hidden="true" className="size-4" />
                Book this resource
              </Link>
            ) : null}
          </div>
        </CardHeader>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-[#102D2C]"
              htmlFor="availability-resource"
            >
              Resource
            </label>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 text-sm text-[#102D2C] shadow-inner shadow-slate-200/30 focus:border-[#087F73] focus:bg-white focus:outline-2 focus:outline-offset-2 focus:outline-[#087F73]"
              id="availability-resource"
              onChange={(event) => updateResourceId(event.target.value)}
              value={resourceId}
            >
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                  {resource.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-[#102D2C]"
              htmlFor="availability-date"
            >
              Date
            </label>
            <div className="flex gap-2">
              <Button
                aria-label="Previous day"
                className="size-10 px-0"
                disabled={!date}
                onClick={() => updateDate(addDays(date, -1))}
                type="button"
                variant="secondary"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </Button>
              <input
                className="h-11 rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 text-sm text-[#102D2C] shadow-inner shadow-slate-200/30 focus:border-[#087F73] focus:bg-white focus:outline-2 focus:outline-offset-2 focus:outline-[#087F73]"
                id="availability-date"
                onChange={(event) => updateDate(event.target.value)}
                type="date"
                value={date}
              />
              <Button
                aria-label="Next day"
                className="size-10 px-0"
                disabled={!date}
                onClick={() => updateDate(addDays(date, 1))}
                type="button"
                variant="secondary"
              >
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
            </div>

            <Button
              className="h-11 rounded-xl px-5"
              disabled={!resourceId || !date || loading}
              onClick={() => void loadAvailability()}
              type="button"
            >
              {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
              {loading ? "Checking..." : "Check availability"}
            </Button>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#B5D2CE] bg-[#F0FAF8] px-4 py-3 text-sm text-[#35625F]">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#087F73]" />
          <p>
            Showing {formatDate(date, timeZone)} in {getTimeZoneLabel(timeZone)}.
          </p>
        </div>
      </Card>

      {error ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>{error}</p>
            <Button
              className="mt-3 h-8 px-3"
              onClick={() => void loadAvailability()}
              size="sm"
              type="button"
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="rounded-2xl border-slate-200/90 p-5 shadow-sm shadow-slate-200/70 sm:p-6">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <Loader2 aria-hidden="true" className="size-5 animate-spin text-primary" />
            Loading availability...
          </div>
        ) : availability ? (
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-[#102D2C]">
                    {availability.resource.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {availability.resource.location ?? "Location not specified"}
                  </p>
                </div>
                {availability.occupied.length === 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    No confirmed reservations
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-[#F8FAF9]">
                <div className="min-w-[720px] p-4">
                  <div className="relative h-12 border-b border-border">
                    {markers.map((marker) => (
                      <div
                        className="absolute top-0 -translate-x-1/2 text-xs font-medium text-muted"
                        key={`${marker.label}-${marker.left}`}
                        style={{ left: marker.left }}
                      >
                        {marker.label}
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-5 h-24 rounded-md border border-slate-200 bg-emerald-50">
                    <div className="absolute inset-0 grid grid-cols-6">
                      {[0, 1, 2, 3, 4, 5].map((item) => (
                        <div
                          className="border-r border-white/80 last:border-r-0"
                          key={item}
                        />
                      ))}
                    </div>
                    {availability.occupied.map((interval, index) => {
                      const left = percentWithinDay(interval.startTime, availability);
                      const right = percentWithinDay(interval.endTime, availability);
                      return (
                        <div
                          aria-label={`Occupied ${intervalLabel(
                            interval,
                            availability.timeZone,
                          )}`}
                          className="absolute top-3 h-18 rounded-md border border-[#0A4D4A] bg-[#087F73] px-3 py-2 text-xs font-semibold text-white shadow-sm"
                          key={`${interval.startTime}-${interval.endTime}-${index}`}
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(right - left, 0.5)}%`,
                          }}
                          title={`Occupied ${intervalLabel(
                            interval,
                            availability.timeZone,
                          )}`}
                        >
                          <span className="line-clamp-2">
                            Occupied
                            <br />
                            {intervalLabel(interval, availability.timeZone)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Green areas are free intervals. Teal blocks are confirmed reservations. Private reservation details are intentionally hidden.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[#087F73]">
                  Free intervals
                </h3>
                <div className="mt-3 space-y-2">
                  {availability.free.map((interval, index) => (
                    <div
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-800"
                      key={`${interval.startTime}-${interval.endTime}-${index}`}
                    >
                      {intervalLabel(interval, availability.timeZone)}
                      <span className="ml-2 text-xs text-emerald-700">
                        {durationLabel(interval)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
                  Occupied intervals
                </h3>
                <div className="mt-3 space-y-2">
                  {availability.occupied.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500">
                      No occupied intervals for this date.
                    </div>
                  ) : (
                    availability.occupied.map((interval, index) => (
                      <div
                        className="rounded-xl border border-[#9CC8C3] bg-[#F0FAF8] px-3 py-3 text-sm font-medium text-slate-800"
                        key={`${interval.startTime}-${interval.endTime}-${index}`}
                      >
                        Busy {intervalLabel(interval, availability.timeZone)}
                        <span className="ml-2 text-xs text-muted">
                          {durationLabel(interval)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <EmptyState
            description="Choose a resource and date to inspect confirmed bookings."
            icon={CalendarDays}
            title="Select a resource"
          />
        )}
      </Card>
    </section>
  );
}
