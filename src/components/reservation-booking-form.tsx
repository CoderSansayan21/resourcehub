"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BookingResource = {
  id: string;
  isActive: boolean;
  name: string;
};

type ReservationResponse = {
  error?: { message?: string };
  reservation?: { id: string };
};

type FormValues = {
  endTime: string;
  notes: string;
  startTime: string;
  title: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const MAX_DURATION_MS = 8 * 60 * 60 * 1000;
const DEFAULT_START_HOUR = 9;
const DEFAULT_DURATION_HOURS = 1;

function getApiMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Reservation could not be created.";
}

function getTimezoneLabel() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Intl.DateTimeFormat("en", {
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")?.value;

  return `${zone}${offset ? ` (${offset})` : ""}`;
}

function getInitialValues(initialDate?: string): FormValues {
  if (!initialDate) {
    return {
      endTime: "",
      notes: "",
      startTime: "",
      title: "",
    };
  }

  const startHour = String(DEFAULT_START_HOUR).padStart(2, "0");
  const endHour = String(DEFAULT_START_HOUR + DEFAULT_DURATION_HOURS).padStart(
    2,
    "0",
  );

  return {
    endTime: `${initialDate}T${endHour}:00`,
    notes: "",
    startTime: `${initialDate}T${startHour}:00`,
    title: "",
  };
}

function formatSelectedDate(initialDate: string) {
  const [year, month, day] = initialDate.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day, 12));
}

function localDateTimeToUtcIso(value: string, field: string) {
  if (!value) {
    throw new Error(`${field} is required.`);
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) {
    throw new Error(`${field} must include a date and time.`);
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    throw new Error(
      `${field} is not valid in your local timezone. Choose another time.`,
    );
  }

  return date.toISOString();
}

function validate(values: FormValues) {
  const errors: FormErrors = {};
  const title = values.title.trim();

  if (!title) errors.title = "Reservation title is required.";
  if (title.length > 120) errors.title = "Title must be 120 characters or fewer.";
  if (values.notes.trim().length > 1000) {
    errors.notes = "Notes must be 1000 characters or fewer.";
  }

  let start: Date | null = null;
  let end: Date | null = null;

  try {
    start = new Date(localDateTimeToUtcIso(values.startTime, "Start time"));
  } catch (error) {
    errors.startTime = getApiMessage(error);
  }

  try {
    end = new Date(localDateTimeToUtcIso(values.endTime, "End time"));
  } catch (error) {
    errors.endTime = getApiMessage(error);
  }

  if (start && end) {
    if (start >= end) {
      errors.endTime = "End time must be after start time.";
    } else if (start <= new Date()) {
      errors.startTime = "Start time must be in the future.";
    } else if (end.getTime() - start.getTime() > MAX_DURATION_MS) {
      errors.endTime = "Reservations cannot be longer than 8 hours.";
    }
  }

  return errors;
}

function buildPayload(resourceId: string, values: FormValues) {
  return {
    endTime: localDateTimeToUtcIso(values.endTime, "End time"),
    notes: values.notes.trim() || null,
    resourceId,
    startTime: localDateTimeToUtcIso(values.startTime, "Start time"),
    title: values.title.trim(),
  };
}

export function ReservationBookingForm({
  initialDate,
  resource,
}: {
  initialDate?: string;
  resource: BookingResource;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    getInitialValues(initialDate),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const timezoneLabel = useMemo(() => getTimezoneLabel(), []);
  const selectedDateLabel = useMemo(
    () => (initialDate ? formatSelectedDate(initialDate) : null),
    [initialDate],
  );
  const availabilityHref = useMemo(() => {
    const params = new URLSearchParams({
      date: values.startTime.slice(0, 10) || initialDate || "",
      resourceId: resource.id,
    });

    if (!params.get("date")) {
      params.delete("date");
    }

    return `/availability?${params.toString()}`;
  }, [initialDate, resource.id, values.startTime]);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setMessage("");
    setSuccess(false);
    setConflict(false);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/reservations", {
        body: JSON.stringify(buildPayload(resource.id, values)),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as
        | ReservationResponse
        | null;

      if (!response.ok) {
        if (response.status === 409) {
          setConflict(true);
          throw new Error("That time is unavailable for this resource. Choose a different slot.");
        }

        throw new Error(data?.error?.message ?? "Reservation could not be created.");
      }

      setSuccess(true);
      setMessage("Reservation confirmed.");
      setValues(getInitialValues(initialDate));
    } catch (error) {
      setMessage(getApiMessage(error));
    } finally {
      setPending(false);
    }
  }

  if (!resource.isActive) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        This resource is inactive, so new reservations are not available.
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-md border border-[#B5D2CE] bg-[#F0FAF8] px-3 py-2 text-sm text-slate-700">
        Booking <span className="font-semibold text-slate-950">{resource.name}</span>
        <span className="block text-xs text-muted">
          Times are entered in your local timezone: {timezoneLabel}.
        </span>
        {selectedDateLabel ? (
          <span className="mt-1 block text-xs font-medium text-slate-700">
            Started from availability for {selectedDateLabel}.
          </span>
        ) : null}
      </div>

      {message ? (
        <div
          className={cn(
            "flex gap-3 rounded-md border px-4 py-3 text-sm",
            success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
          role={success ? "status" : "alert"}
        >
          {success ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          <span>
            {message}{" "}
            {success ? (
              <Link className="font-semibold underline" href="/reservations">
                View in reservations
              </Link>
            ) : conflict ? (
              <Link className="font-semibold underline" href={availabilityHref}>
                Check availability
              </Link>
            ) : null}
          </span>
        </div>
      ) : null}

      <div>
        <Input
          aria-invalid={errors.title ? "true" : "false"}
          disabled={pending}
          label="Reservation title"
          maxLength={120}
          name="title"
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="Team planning session"
          required
          value={values.title}
        />
        {errors.title ? (
          <p className="mt-2 text-xs text-red-600">{errors.title}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            aria-invalid={errors.startTime ? "true" : "false"}
            disabled={pending}
            label="Start date and time"
            name="startTime"
            onChange={(event) => updateField("startTime", event.target.value)}
            required
            type="datetime-local"
            value={values.startTime}
          />
          {errors.startTime ? (
            <p className="mt-2 text-xs text-red-600">{errors.startTime}</p>
          ) : null}
        </div>
        <div>
          <Input
            aria-invalid={errors.endTime ? "true" : "false"}
            disabled={pending}
            label="End date and time"
            name="endTime"
            onChange={(event) => updateField("endTime", event.target.value)}
            required
            type="datetime-local"
            value={values.endTime}
          />
          {errors.endTime ? (
            <p className="mt-2 text-xs text-red-600">{errors.endTime}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-800" htmlFor="notes">
          Notes
        </label>
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          disabled={pending}
          id="notes"
          maxLength={1000}
          name="notes"
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Optional setup notes"
          value={values.notes}
        />
        {errors.notes ? (
          <p className="mt-2 text-xs text-red-600">{errors.notes}</p>
        ) : null}
      </div>

      <Button className="w-full" disabled={pending} type="submit">
        {pending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <CalendarClock aria-hidden="true" className="size-4" />
        )}
        {pending ? "Confirming..." : "Confirm reservation"}
      </Button>
    </form>
  );
}
