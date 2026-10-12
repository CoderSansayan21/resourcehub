"use client";

import Link from "next/link";
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
  Search,
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

function getTodayDate() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function addDays(dateValue: string, amount: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
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
  const [timeZone] = useState(getBrowserTimeZone);
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
      <EmptyState
        description="No visible resources are available for availability lookup yet."
        icon={Search}
        title="No resources available"
      />
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="availability-title">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2
                className="text-xl font-semibold tracking-tight text-slate-950"
                id="availability-title"
              >
                Day availability
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Availability is informational. Reservation submission remains protected
                by server validation and the database overlap constraint.
              </p>
            </div>
            {selectedResource ? (
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white shadow-sm shadow-teal-950/10 transition-colors hover:bg-[#066B62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href={`/resources/${selectedResource.id}?date=${date}`}
              >
                <CalendarDays aria-hidden="true" className="size-4" />
                Book this resource
              </Link>
            ) : null}
          </div>
        </CardHeader>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="availability-resource"
            >
              Resource
            </label>
            <select
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
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
              className="text-sm font-medium text-slate-800"
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
                className="h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
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
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-md border border-[#B5D2CE] bg-[#F0FAF8] px-4 py-3 text-sm text-slate-700">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Showing {formatDate(date, timeZone)} in {getTimeZoneLabel(timeZone)}.
          </p>
        </div>
      </Card>

      {error ? (
        <div
          className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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

      <Card>
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted">
            <Loader2 aria-hidden="true" className="size-5 animate-spin text-primary" />
            Loading availability...
          </div>
        ) : availability ? (
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {availability.resource.name}
                  </h2>
                  <p className="text-sm text-muted">
                    {availability.resource.location ?? "Location not specified"}
                  </p>
                </div>
                {availability.occupied.length === 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    No confirmed reservations
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto rounded-lg border border-border bg-white">
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
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Green areas are free intervals. Teal blocks are confirmed
                    reservations. Private reservation details are intentionally hidden.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Free intervals
                </h3>
                <div className="mt-3 space-y-2">
                  {availability.free.map((interval, index) => (
                    <div
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
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
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Occupied intervals
                </h3>
                <div className="mt-3 space-y-2">
                  {availability.occupied.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-muted">
                      No occupied intervals for this date.
                    </div>
                  ) : (
                    availability.occupied.map((interval, index) => (
                      <div
                        className="rounded-md border border-[#9CC8C3] bg-[#F0FAF8] px-3 py-2 text-sm text-slate-800"
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
