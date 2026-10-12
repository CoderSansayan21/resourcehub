"use client";

import Link from "next/link";
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
  userId: string;
};

type ApiResponse = {
  error?: { message?: string };
  reservation?: Reservation;
  reservations?: Reservation[];
};

type FilterValue = "all" | "upcoming" | "past" | "cancelled";

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

function getBucket(reservation: Reservation) {
  if (reservation.status === "CANCELLED") return "cancelled";
  return new Date(reservation.endTime) <= new Date() ? "past" : "upcoming";
}

function canMutate(reservation: Reservation, currentUserId: string) {
  return (
    reservation.userId === currentUserId &&
    reservation.status === "CONFIRMED" &&
    new Date(reservation.startTime) > new Date()
  );
}

function statusLabel(reservation: Reservation) {
  const bucket = getBucket(reservation);
  if (bucket === "cancelled") return "Cancelled";
  if (bucket === "past") return "Past";
  return "Upcoming";
}

function StatusBadge({ reservation }: { reservation: Reservation }) {
  const bucket = getBucket(reservation);
  return (
    <Badge
      className={cn(
        "gap-1.5",
        bucket === "upcoming" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        bucket === "past" && "border-blue-200 bg-blue-50 text-blue-700",
        bucket === "cancelled" && "border-slate-200 bg-slate-100 text-slate-600",
      )}
      variant={bucket === "upcoming" ? "green" : bucket === "past" ? "blue" : "slate"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          bucket === "upcoming" && "bg-emerald-500",
          bucket === "past" && "bg-blue-500",
          bucket === "cancelled" && "bg-slate-400",
        )}
      />
      {statusLabel(reservation)}
    </Badge>
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
            <StatusBadge reservation={reservation} />
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
            Admin inspection view. This reservation is{" "}
            {reservation.userId === currentUserId ? "owned by you" : "owned by another user"}.
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
          {reservation.title} will be marked cancelled and remain visible in your
          reservation history.
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

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <StatusBadge reservation={reservation} />
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
            {reservation.title}
          </h2>
          <p className="mt-1 text-sm font-medium text-primary">
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
            {formatDate(reservation.startTime)} ·{" "}
            {formatTimeRange(reservation.startTime, reservation.endTime)}
          </dd>
        </div>
        {reservation.resource.location ? (
          <div className="flex gap-2 text-slate-700">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 text-muted" />
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
              {reservation.userId === currentUserId ? "You" : reservation.userId}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
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
            <Button
              onClick={() => onCancel(reservation)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </>
        ) : null}
      </div>
    </article>
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
      const bucket = getBucket(reservation);
      const filterMatches = filter === "all" || bucket === filter;
      const queryMatches =
        !normalizedQuery ||
        reservation.title.toLowerCase().includes(normalizedQuery) ||
        reservation.resource.name.toLowerCase().includes(normalizedQuery) ||
        reservation.resource.type.toLowerCase().includes(normalizedQuery) ||
        (reservation.resource.location ?? "").toLowerCase().includes(normalizedQuery);

      return filterMatches && queryMatches;
    });
  }, [filter, query, reservations]);

  return (
    <section className="space-y-5" aria-labelledby="reservation-list-title">
      <Card className="p-0">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                className="text-xl font-semibold tracking-tight text-slate-950"
                id="reservation-list-title"
              >
                {userRole === "ADMIN" ? "All reservations" : "Reservation history"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {userRole === "ADMIN"
                  ? "Inspect bookings across the workspace. Mutations are only available on reservations you own."
                  : "Manage upcoming reservations and review past or cancelled bookings."}
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href="/resources"
            >
              <CalendarClock aria-hidden="true" className="size-4" />
              Book a resource
            </Link>
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
                className="h-10 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                id="reservation-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, resource, type, or location"
                type="search"
                value={query}
              />
            </div>

            <div
              aria-label="Filter reservations"
              className="inline-flex overflow-x-auto rounded-md border border-border bg-white p-1 shadow-sm"
              role="group"
            >
              {(["all", "upcoming", "past", "cancelled"] as const).map((item) => (
                <button
                  className={cn(
                    "h-8 whitespace-nowrap rounded px-3 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    filter === item
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-slate-50",
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

        <div className="p-5">
          {refreshing && reservations.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  className="h-64 animate-pulse rounded-lg border border-border bg-slate-100"
                  key={item}
                />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <EmptyState
              action={
                <Link
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  href="/resources"
                >
                  Browse resources
                </Link>
              }
              description={
                userRole === "ADMIN"
                  ? "No reservations exist yet."
                  : "You do not have any reservations yet. Book an active resource to get started."
              }
              icon={CalendarClock}
              title="No reservations to show"
            />
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
