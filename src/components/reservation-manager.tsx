"use client";

import Link from "next/link";
import Image from "next/image";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ReservationStatus = "CONFIRMED" | "CANCELLED";
type UserRole = "ADMIN" | "MEMBER";

type Reservation = {
  createdAt: string;
  endTime: string;
  id: string;
  notes: string | null;
  resource: {
    capacity: number | null;
    id: string;
    isActive: boolean;
    location: string | null;
    name: string;
    type: string;
  };
  resourceId: string;
  startTime: string;
  status: ReservationStatus;
  title: string;
  updatedAt: string;
  user: {
    email: string;
    id: string;
    name: string;
  };
  userId: string;
};

type ApiResponse = {
  error?: { message?: string };
  reservation?: Reservation;
  reservations?: Reservation[];
};

type FilterValue = "all" | "upcoming" | "ongoing" | "past" | "cancelled";
type TemporalState = "ongoing" | "past" | "upcoming";

type EditValues = {
  endTime: string;
  notes: string;
  startTime: string;
  title: string;
};

type FieldErrors = Partial<Record<keyof EditValues, string>>;

const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

function getApiMessage(error: unknown) {
  return error instanceof Error ? error.message : "Reservation request failed.";
}

function localDateTimeToUtcIso(value: string, field: string) {
  if (!value) throw new Error(`${field} is required.`);

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) throw new Error(`${field} must include a date and time.`);

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

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
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

function getTemporalState(reservation: Reservation, now = new Date()): TemporalState {
  const start = new Date(reservation.startTime);
  const end = new Date(reservation.endTime);

  if (start > now) return "upcoming";
  if (end <= now) return "past";
  return "ongoing";
}

function getFilterBucket(reservation: Reservation, now = new Date()): FilterValue {
  if (reservation.status === "CANCELLED") return "cancelled";
  return getTemporalState(reservation, now);
}

function canMutate(reservation: Reservation, currentUserId: string) {
  return (
    reservation.userId === currentUserId &&
    reservation.status === "CONFIRMED" &&
    getTemporalState(reservation) === "upcoming"
  );
}

function canCancel(reservation: Reservation, currentUserId: string, userRole: UserRole) {
  return (
    reservation.status === "CONFIRMED" &&
    getTemporalState(reservation) === "upcoming" &&
    (userRole === "ADMIN" || reservation.userId === currentUserId)
  );
}

function StatusBadge({ reservation }: { reservation: Reservation }) {
  const cancelled = reservation.status === "CANCELLED";
  return (
    <Badge
      className={cn(
        "gap-1.5",
        cancelled
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
      variant={cancelled ? "slate" : "green"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          cancelled ? "bg-slate-400" : "bg-emerald-500",
        )}
      />
      {cancelled ? "Cancelled" : "Confirmed"}
    </Badge>
  );
}

function TemporalBadge({ reservation }: { reservation: Reservation }) {
  if (reservation.status === "CANCELLED") return null;

  const temporalState = getTemporalState(reservation);

  return (
    <Badge
      className={cn(
        "gap-1.5",
        temporalState === "upcoming" && "border-teal-200 bg-teal-50 text-teal-700",
        temporalState === "ongoing" && "border-amber-200 bg-amber-50 text-amber-700",
        temporalState === "past" && "border-blue-200 bg-blue-50 text-blue-700",
      )}
      variant={temporalState === "past" ? "blue" : temporalState === "upcoming" ? "green" : "slate"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          temporalState === "upcoming" && "bg-teal-500",
          temporalState === "ongoing" && "bg-amber-500",
          temporalState === "past" && "bg-blue-500",
        )}
      />
      {temporalState === "upcoming" ? "Upcoming" : temporalState === "ongoing" ? "Ongoing" : "Past"}
    </Badge>
  );
}

function ReservationStats({ reservations }: { reservations: Reservation[] }) {
  const now = new Date();
  const counts = reservations.reduce(
    (summary, reservation) => {
      if (reservation.status === "CANCELLED") {
        summary.cancelled += 1;
      } else {
        const temporalState = getTemporalState(reservation, now);
        summary[temporalState] += 1;
      }

      return summary;
    },
    { cancelled: 0, ongoing: 0, past: 0, upcoming: 0 },
  );

  const cards = [
    { label: "Total reservations", tone: "text-[#102D2C]", value: reservations.length },
    { label: "Upcoming", tone: "text-[#087F73]", value: counts.upcoming },
    { label: "Ongoing", tone: "text-amber-700", value: counts.ongoing },
    { label: "Past", tone: "text-blue-700", value: counts.past },
    { label: "Cancelled", tone: "text-slate-600", value: counts.cancelled },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Reservation statistics">
      {cards.map((card) => (
        <Card className="rounded-2xl border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/70" key={card.label}>
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className={cn("mt-3 text-3xl font-bold tracking-tight", card.tone)}>
            {card.value.toLocaleString("en")}
          </p>
        </Card>
      ))}
    </section>
  );
}

function validate(values: EditValues) {
  const errors: FieldErrors = {};
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
    if (start >= end) errors.endTime = "End time must be after start time.";
    else if (start <= new Date()) errors.startTime = "Start time must be in the future.";
    else if (end.getTime() - start.getTime() > MAX_DURATION_MS) {
      errors.endTime = "Reservations cannot be longer than 8 hours.";
    }
  }

  return errors;
}

function valuesFromReservation(reservation: Reservation): EditValues {
  return {
    endTime: toLocalInputValue(reservation.endTime),
    notes: reservation.notes ?? "",
    startTime: toLocalInputValue(reservation.startTime),
    title: reservation.title,
  };
}

function DetailDialog({
  currentUserId,
  onClose,
  reservation,
  userRole,
}: {
  currentUserId: string;
  onClose: () => void;
  reservation: Reservation;
  userRole: UserRole;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-labelledby="reservation-detail-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge reservation={reservation} />
              <TemporalBadge reservation={reservation} />
            </div>
            <h2
              className="mt-3 text-xl font-semibold tracking-tight text-slate-950"
              id="reservation-detail-title"
            >
              {reservation.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {reservation.resource.name}
            </p>
          </div>
          <Button
            aria-label="Close reservation details"
            className="size-10 shrink-0 px-0"
            onClick={onClose}
            ref={closeRef}
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-slate-50 p-4">
            <dt className="text-sm font-medium text-muted">Date</dt>
            <dd className="mt-1 font-semibold text-slate-950">
              {formatDate(reservation.startTime)}
            </dd>
          </div>
          <div className="rounded-md border border-border bg-slate-50 p-4">
            <dt className="text-sm font-medium text-muted">Time</dt>
            <dd className="mt-1 font-semibold text-slate-950">
              {formatTimeRange(reservation.startTime, reservation.endTime)}
            </dd>
          </div>
          <div className="rounded-md border border-border bg-slate-50 p-4">
            <dt className="text-sm font-medium text-muted">Resource type</dt>
            <dd className="mt-1 font-semibold text-slate-950">
              {reservation.resource.type}
            </dd>
          </div>
          <div className="rounded-md border border-border bg-slate-50 p-4">
            <dt className="text-sm font-medium text-muted">Location</dt>
            <dd className="mt-1 font-semibold text-slate-950">
              {reservation.resource.location ?? "Not specified"}
            </dd>
          </div>
        </dl>

        {reservation.notes ? (
          <div className="mt-5 rounded-md border border-border p-4">
            <h3 className="text-sm font-semibold text-slate-950">Notes</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{reservation.notes}</p>
          </div>
        ) : null}

        {userRole === "ADMIN" ? (
          <p className="mt-5 rounded-md border border-[#B5D2CE] bg-[#F0FAF8] px-3 py-2 text-sm text-slate-700">
            Admin inspection view. Booked by{" "}
            {reservation.userId === currentUserId
              ? "you"
              : `${reservation.user.name} (${reservation.user.email})`}
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EditDialog({
  onClose,
  onSaved,
  reservation,
}: {
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
  reservation: Reservation;
}) {
  const [values, setValues] = useState<EditValues>(valuesFromReservation(reservation));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const timezoneLabel = useMemo(() => getTimezoneLabel(), []);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, pending]);

  function updateField(field: keyof EditValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);

    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        body: JSON.stringify({
          endTime: localDateTimeToUtcIso(values.endTime, "End time"),
          notes: values.notes.trim() || null,
          startTime: localDateTimeToUtcIso(values.startTime, "Start time"),
          title: values.title.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = (await response.json().catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? "That time is unavailable for this resource. Choose a different slot."
            : data?.error?.message ?? "Reservation could not be updated.",
        );
      }

      await onSaved("Reservation updated.");
      onClose();
    } catch (error) {
      setMessage(getApiMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      aria-labelledby="edit-reservation-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6"
      role="dialog"
    >
      <form
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-lg sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold tracking-tight text-slate-950"
              id="edit-reservation-title"
            >
              Reschedule reservation
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Editing {reservation.resource.name}. Times use {timezoneLabel}.
            </p>
          </div>
          <Button
            aria-label="Close reschedule form"
            className="size-10 shrink-0 px-0"
            disabled={pending}
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        {message ? (
          <div
            className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          <div>
            <Input
              aria-invalid={errors.title ? "true" : "false"}
              disabled={pending}
              label="Reservation title"
              maxLength={120}
              name="title"
              onChange={(event) => updateField("title", event.target.value)}
              ref={firstRef}
              required
              value={values.title}
            />
            {errors.title ? <p className="mt-2 text-xs text-red-600">{errors.title}</p> : null}
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
            <label className="text-sm font-medium text-slate-800" htmlFor="edit-notes">
              Notes
            </label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              disabled={pending}
              id="edit-notes"
              maxLength={1000}
              onChange={(event) => updateField("notes", event.target.value)}
              value={values.notes}
            />
            {errors.notes ? <p className="mt-2 text-xs text-red-600">{errors.notes}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            )}
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CancelDialog({
  loading,
  onCancel,
  onConfirm,
  reservation,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  reservation: Reservation;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      aria-labelledby="cancel-reservation-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex size-11 items-center justify-center rounded-md bg-red-50 text-red-700">
          <CalendarClock aria-hidden="true" className="size-5" />
        </div>
        <h2
          className="mt-5 text-xl font-semibold tracking-tight text-slate-950"
          id="cancel-reservation-title"
        >
          Cancel this reservation?
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          This will mark the booking for {reservation.resource.name} on{" "}
          {formatDate(reservation.startTime)} from{" "}
          {formatTimeRange(reservation.startTime, reservation.endTime)} as cancelled.
          The record will remain visible, but the time slot will become available
          for new reservations.
        </p>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700">
          Confirm only if this reservation should no longer be honored.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={loading}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
            variant="secondary"
          >
            Keep reservation
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-800"
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Cancel reservation
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReservationCard({
  currentUserId,
  onCancel,
  onEdit,
  onView,
  reservation,
  userRole,
}: {
  currentUserId: string;
  onCancel: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onView: (reservation: Reservation) => void;
  reservation: Reservation;
  userRole: UserRole;
}) {
  const editable = canMutate(reservation, currentUserId);
  const cancellable = canCancel(reservation, currentUserId, userRole);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:border-[#B5D2CE] hover:shadow-md hover:shadow-teal-950/10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StatusBadge reservation={reservation} />
            <TemporalBadge reservation={reservation} />
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-[#102D2C]">
            {reservation.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#087F73]">
            {reservation.resource.name}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Date and time
          </dt>
          <dd className="mt-1 text-slate-800">
            {formatDate(reservation.startTime)} &middot;{" "}
            {formatTimeRange(reservation.startTime, reservation.endTime)}
          </dd>
        </div>
        {reservation.resource.location ? (
          <div className="flex gap-2 text-sm text-slate-700">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 text-[#087F73]" />
            <dt className="sr-only">Location</dt>
            <dd>{reservation.resource.location}</dd>
          </div>
        ) : null}
        {userRole === "ADMIN" ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Owner
            </dt>
            <dd className="mt-1 break-all text-slate-700">
              {reservation.userId === currentUserId
                ? "You"
                : `${reservation.user.name} (${reservation.user.email})`}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-5">
        <Button
          onClick={() => onView(reservation)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Eye aria-hidden="true" className="size-4" />
          Details
        </Button>
        {editable ? (
          <>
            <Button
              onClick={() => onEdit(reservation)}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Reschedule
            </Button>
          </>
        ) : null}
        {cancellable ? (
          <Button
            onClick={() => onCancel(reservation)}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function AdminReservationTable({
  currentUserId,
  onCancel,
  onEdit,
  onView,
  reservations,
}: {
  currentUserId: string;
  onCancel: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onView: (reservation: Reservation) => void;
  reservations: Reservation[];
}) {
  const userRole: UserRole = "ADMIN";

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-[#F8FAF9]">
            <tr>
              {['Reservation', 'Resource', 'Booked by', 'Date', 'Time', 'Status', 'Actions'].map((heading) => (
                <th
                  className={cn(
                    "px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-500",
                    heading === "Actions" && "text-right",
                  )}
                  key={heading}
                  scope="col"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {reservations.map((reservation) => {
              const editable = canMutate(reservation, currentUserId);
              const cancellable = canCancel(reservation, currentUserId, userRole);

              return (
                <tr className="transition hover:bg-[#F8FAF9]" key={reservation.id}>
                  <td className="max-w-48 px-4 py-4">
                    <p className="truncate font-bold text-[#102D2C]">{reservation.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{reservation.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#087F73]">{reservation.resource.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{reservation.resource.type}</p>
                  </td>
                  <td className="max-w-40 px-4 py-4 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      {reservation.user.name}
                    </p>
                    <p className="mt-1 break-all text-slate-500">
                      {reservation.user.email}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
                    {formatDate(reservation.startTime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
                    {formatTimeRange(reservation.startTime, reservation.endTime)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge reservation={reservation} />
                      <TemporalBadge reservation={reservation} />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => onView(reservation)} size="sm" type="button" variant="secondary">
                        <Eye aria-hidden="true" className="size-4" />
                        View
                      </Button>
                      {editable ? (
                        <>
                          <Button onClick={() => onEdit(reservation)} size="sm" type="button" variant="secondary">
                            <Pencil aria-hidden="true" className="size-4" />
                            Edit
                          </Button>
                          <Button onClick={() => onCancel(reservation)} size="sm" type="button" variant="ghost">
                            Cancel
                          </Button>
                        </>
                      ) : null}
                      {!editable && cancellable ? (
                        <Button onClick={() => onCancel(reservation)} size="sm" type="button" variant="ghost">
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {reservations.map((reservation) => (
          <ReservationCard
            currentUserId={currentUserId}
            key={reservation.id}
            onCancel={onCancel}
            onEdit={onEdit}
            onView={onView}
            reservation={reservation}
            userRole={userRole}
          />
        ))}
      </div>
    </>
  );
}

export function ReservationManager({
  currentUserId,
  reservations: initialReservations,
  userRole,
}: {
  currentUserId: string;
  reservations: Reservation[];
  userRole: UserRole;
}) {
  const [reservations, setReservations] = useState(initialReservations);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewing, setViewing] = useState<Reservation | null>(null);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [cancelPending, setCancelPending] = useState(false);

  async function refreshReservations(message?: string) {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/reservations", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Reservations could not be loaded.");
      }

      setReservations(data?.reservations ?? []);
      if (message) setSuccess(message);
    } catch (requestError) {
      setError(getApiMessage(requestError));
    } finally {
      setRefreshing(false);
    }
  }

  async function cancelReservation() {
    if (!cancelling) return;

    setCancelPending(true);
    setError("");

    try {
      const response = await fetch(`/api/reservations/${cancelling.id}/cancel`, {
        method: "PATCH",
      });
      const data = (await response.json().catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Reservation could not be cancelled.");
      }

      setCancelling(null);
      await refreshReservations("Reservation cancelled.");
    } catch (requestError) {
      setError(getApiMessage(requestError));
    } finally {
      setCancelPending(false);
    }
  }

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => setSuccess(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const filteredReservations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const bucket = getFilterBucket(reservation);
      const filterMatches = filter === "all" || bucket === filter;
      const queryMatches =
        !normalizedQuery ||
        reservation.title.toLowerCase().includes(normalizedQuery) ||
        reservation.resource.name.toLowerCase().includes(normalizedQuery) ||
        reservation.resource.type.toLowerCase().includes(normalizedQuery) ||
        (reservation.resource.location ?? "").toLowerCase().includes(normalizedQuery) ||
        reservation.user.name.toLowerCase().includes(normalizedQuery) ||
        reservation.user.email.toLowerCase().includes(normalizedQuery);

      return filterMatches && queryMatches;
    });
  }, [filter, query, reservations]);

  const isAdmin = userRole === "ADMIN";

  return (
    <section className="space-y-5" aria-labelledby="reservation-list-title">
      {isAdmin ? <ReservationStats reservations={reservations} /> : null}
      <Card className="overflow-hidden rounded-2xl border-slate-200/90 p-0 shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-200/90 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F3] text-[#087F73]">
                <CalendarClock aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2
                  className="text-xl font-bold tracking-tight text-[#102D2C]"
                  id="reservation-list-title"
                >
                  {isAdmin ? "All reservations" : "Reservation history"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isAdmin
                    ? "View and monitor reservation activity across ResourceHub."
                    : "Manage upcoming reservations and review past or cancelled bookings."}
                </p>
              </div>
            </div>
            {!isAdmin ? (
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#087F73] px-4 text-sm font-semibold text-white shadow-sm shadow-teal-950/10 transition hover:bg-[#066B62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]"
                href="/resources"
              >
                <CalendarClock aria-hidden="true" className="size-4" />
                Book a resource
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <label className="sr-only" htmlFor="reservation-search">
                Search reservations
              </label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAF9] pl-10 pr-3 text-sm text-[#102D2C] shadow-inner shadow-slate-200/30 placeholder:text-slate-500 focus:border-[#087F73] focus:bg-white focus:outline-2 focus:outline-offset-2 focus:outline-[#087F73]"
                id="reservation-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, resource, member, type, or location"
                type="search"
                value={query}
              />
            </div>

            <div
              aria-label="Filter reservations"
              className="inline-flex overflow-x-auto rounded-xl border border-slate-200 bg-[#F8FAF9] p-1 shadow-inner shadow-slate-200/30"
              role="group"
            >
              {(["all", "upcoming", "ongoing", "past", "cancelled"] as const).map((item) => (
                <button
                  className={cn(
                    "h-9 whitespace-nowrap rounded-lg px-3 text-sm font-semibold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]",
                    filter === item
                      ? "bg-[#087F73] text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-[#102D2C]",
                  )}
                  key={item}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div aria-live="polite" className="sr-only" role="status">
          {success || error || (refreshing ? "Refreshing reservations" : "")}
        </div>

        {success ? (
          <div className="mx-5 mt-5 flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        {error ? (
          <div
            className="mx-5 mt-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div>
              <p>{error}</p>
              <Button
                className="mt-3 h-8 px-3"
                disabled={refreshing}
                onClick={() => void refreshReservations()}
                size="sm"
                type="button"
                variant="secondary"
              >
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        <div className="bg-[#F8FAF9]/65 p-5 sm:p-6">
          {refreshing && reservations.length === 0 ? (
            <div className={isAdmin ? "space-y-3" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
              {[0, 1, 2].map((item) => (
                <div
                  className={isAdmin ? "h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-100" : "h-64 animate-pulse rounded-lg border border-border bg-slate-100"}
                  key={item}
                />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            isAdmin ? (
              <EmptyState
                description="Member reservations will appear here once resources are booked."
                icon={CalendarClock}
                title="No reservations yet"
              />
            ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#B5D2CE] bg-white px-6 py-10 text-center">
              <Image
                alt="An empty calendar illustration"
                className="h-auto w-44 object-contain sm:w-52"
                height={512}
                src="/images/reservations/reservations-empty.png"
                width={512}
              />
              <h2 className="mt-5 text-xl font-bold text-[#102D2C]">No reservations to show</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                You do not have any reservations yet. Book an active resource to get started.
              </p>
              <Link
                className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#087F73] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066B62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]"
                href="/resources"
              >
                Browse resources
              </Link>
            </div>
            )
          ) : filteredReservations.length === 0 ? (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                  type="button"
                  variant="secondary"
                >
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  Clear filters
                </Button>
              }
              description="Try another keyword or status filter."
              icon={Search}
              title="No matching reservations"
            />
          ) : isAdmin ? (
            <AdminReservationTable
              currentUserId={currentUserId}
              onCancel={setCancelling}
              onEdit={setEditing}
              onView={setViewing}
              reservations={filteredReservations}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredReservations.map((reservation) => (
                <ReservationCard
                  currentUserId={currentUserId}
                  key={reservation.id}
                  onCancel={setCancelling}
                  onEdit={setEditing}
                  onView={setViewing}
                  reservation={reservation}
                  userRole={userRole}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {viewing ? (
        <DetailDialog
          currentUserId={currentUserId}
          onClose={() => setViewing(null)}
          reservation={viewing}
          userRole={userRole}
        />
      ) : null}

      {editing ? (
        <EditDialog
          onClose={() => setEditing(null)}
          onSaved={refreshReservations}
          reservation={editing}
        />
      ) : null}

      {cancelling ? (
        <CancelDialog
          loading={cancelPending}
          onCancel={() => setCancelling(null)}
          onConfirm={() => void cancelReservation()}
          reservation={cancelling}
        />
      ) : null}
    </section>
  );
}
