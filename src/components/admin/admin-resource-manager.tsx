"use client";

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Edit3,
  Loader2,
  PackagePlus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

type ResourceFormValues = {
  capacity: string;
  description: string;
  location: string;
  name: string;
  type: string;
};

type FieldErrors = Partial<Record<keyof ResourceFormValues, string>>;
type StatusFilter = "all" | "active" | "inactive";
type ModalMode = "create" | "edit";

const emptyFormValues: ResourceFormValues = {
  capacity: "",
  description: "",
  location: "",
  name: "",
  type: "",
};

function getApiError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

async function parseResourceResponse(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | { error?: { message?: string }; resource?: Resource; resources?: Resource[] }
    | null;

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Resource request failed.");
  }

  return data;
}

function valuesFromResource(resource: Resource): ResourceFormValues {
  return {
    capacity: resource.capacity?.toString() ?? "",
    description: resource.description ?? "",
    location: resource.location ?? "",
    name: resource.name,
    type: resource.type,
  };
}

function validate(values: ResourceFormValues) {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  const type = values.type.trim();
  const description = values.description.trim();
  const location = values.location.trim();
  const capacity = values.capacity.trim();

  if (!name) errors.name = "Resource name is required.";
  if (name.length > 120) errors.name = "Name must be 120 characters or fewer.";
  if (!type) errors.type = "Resource type is required.";
  if (type.length > 80) errors.type = "Type must be 80 characters or fewer.";
  if (description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }
  if (location.length > 160) {
    errors.location = "Location must be 160 characters or fewer.";
  }
  if (capacity) {
    const parsed = Number(capacity);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.capacity = "Capacity must be a positive whole number.";
    }
  }

  return errors;
}

function toPayload(values: ResourceFormValues) {
  const capacity = values.capacity.trim();

  return {
    capacity: capacity ? Number(capacity) : null,
    description: values.description.trim() || null,
    location: values.location.trim() || null,
    name: values.name.trim(),
    type: values.type.trim(),
  };
}

function ResourceStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={cn(
        "gap-1.5",
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600",
      )}
      variant={isActive ? "green" : "slate"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function ResourceActions({
  busy,
  onDeactivate,
  onEdit,
  onReactivate,
  resource,
}: {
  busy: boolean;
  onDeactivate: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onReactivate: (resource: Resource) => void;
  resource: Resource;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        aria-label={`Edit ${resource.name}`}
        disabled={busy}
        onClick={() => onEdit(resource)}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Edit3 aria-hidden="true" className="size-4" />
        Edit
      </Button>
      {resource.isActive ? (
        <Button
          aria-label={`Deactivate ${resource.name}`}
          disabled={busy}
          onClick={() => onDeactivate(resource)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Archive aria-hidden="true" className="size-4" />
          Deactivate
        </Button>
      ) : (
        <Button
          aria-label={`Reactivate ${resource.name}`}
          disabled={busy}
          onClick={() => onReactivate(resource)}
          size="sm"
          type="button"
          variant="secondary"
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RotateCcw aria-hidden="true" className="size-4" />
          )}
          Reactivate
        </Button>
      )}
    </div>
  );
}

function ResourceFormModal({
  mode,
  onClose,
  onSubmit,
  resource,
  saving,
}: {
  mode: ModalMode;
  onClose: () => void;
  onSubmit: (values: ResourceFormValues) => Promise<void>;
  resource: Resource | null;
  saving: boolean;
}) {
  const [values, setValues] = useState<ResourceFormValues>(
    resource ? valuesFromResource(resource) : emptyFormValues,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  function updateField(field: keyof ResourceFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      setFormError(getApiError(error));
    }
  }

  return (
    <div
      aria-labelledby="resource-form-title"
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
              id="resource-form-title"
            >
              {mode === "create" ? "Add resource" : "Edit resource"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Keep resource details accurate so members see the right inventory.
            </p>
          </div>
          <Button
            aria-label="Close resource form"
            className="size-10 shrink-0 px-0"
            disabled={saving}
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        {formError ? (
          <div
            className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <Input
              aria-invalid={errors.name ? "true" : "false"}
              autoComplete="off"
              disabled={saving}
              id="resource-name"
              label="Resource name"
              maxLength={120}
              name="name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Boardroom A"
              ref={nameRef}
              required
              value={values.name}
            />
            {errors.name ? (
              <p className="mt-2 text-xs text-red-600">{errors.name}</p>
            ) : null}
          </div>

          <div>
            <Input
              aria-invalid={errors.type ? "true" : "false"}
              autoComplete="off"
              disabled={saving}
              id="resource-type"
              label="Type"
              maxLength={80}
              name="type"
              onChange={(event) => updateField("type", event.target.value)}
              placeholder="Meeting room"
              required
              value={values.type}
            />
            {errors.type ? (
              <p className="mt-2 text-xs text-red-600">{errors.type}</p>
            ) : null}
          </div>

          <div>
            <Input
              aria-invalid={errors.location ? "true" : "false"}
              autoComplete="off"
              disabled={saving}
              id="resource-location"
              label="Location"
              maxLength={160}
              name="location"
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="Floor 2, east wing"
              value={values.location}
            />
            {errors.location ? (
              <p className="mt-2 text-xs text-red-600">{errors.location}</p>
            ) : null}
          </div>

          <div>
            <Input
              aria-invalid={errors.capacity ? "true" : "false"}
              disabled={saving}
              id="resource-capacity"
              inputMode="numeric"
              label="Capacity"
              min={1}
              name="capacity"
              onChange={(event) => updateField("capacity", event.target.value)}
              placeholder="12"
              type="number"
              value={values.capacity}
            />
            {errors.capacity ? (
              <p className="mt-2 text-xs text-red-600">{errors.capacity}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="resource-description"
          >
            Description
          </label>
          <textarea
            aria-invalid={errors.description ? "true" : "false"}
            className={cn(
              "mt-2 min-h-28 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
              "placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary",
              "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
            )}
            disabled={saving}
            id="resource-description"
            maxLength={500}
            name="description"
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Optional notes about equipment, access, or setup."
            value={values.description}
          />
          {errors.description ? (
            <p className="mt-2 text-xs text-red-600">{errors.description}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={saving}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <PackagePlus aria-hidden="true" className="size-4" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            )}
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Create resource"
                : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function DeactivationDialog({
  loading,
  onCancel,
  onConfirm,
  resource,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  resource: Resource;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel]);

  return (
    <div
      aria-labelledby="deactivate-resource-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex size-11 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <Archive aria-hidden="true" className="size-5" />
        </div>
        <h2
          className="mt-5 text-xl font-semibold tracking-tight text-slate-950"
          id="deactivate-resource-title"
        >
          Deactivate {resource.name}?
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Deactivation hides this resource from members but preserves reservation
          history and admin records. You can reactivate it later.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={loading}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
            variant="secondary"
          >
            Keep active
          </Button>
          <Button
            className="bg-amber-700 hover:bg-amber-800"
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Archive aria-hidden="true" className="size-4" />
            )}
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResourceInventory({
  filteredResources,
  onDeactivate,
  onEdit,
  onReactivate,
  statusLoadingId,
}: {
  filteredResources: Resource[];
  onDeactivate: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onReactivate: (resource: Resource) => void;
  statusLoadingId: string | null;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-md border border-border lg:block">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-slate-50">
            <tr>
              {["Resource", "Type", "Location", "Capacity", "Status"].map(
                (heading) => (
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted"
                    key={heading}
                  >
                    {heading}
                  </th>
                ),
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {filteredResources.map((resource) => (
              <tr key={resource.id}>
                <td className="max-w-xs px-4 py-4">
                  <p className="font-medium text-slate-950">{resource.name}</p>
                  {resource.description ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">
                      {resource.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  {resource.type}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  {resource.location ?? "Not set"}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  {resource.capacity ?? "Not set"}
                </td>
                <td className="px-4 py-4">
                  <ResourceStatusBadge isActive={resource.isActive} />
                </td>
                <td className="px-4 py-4">
                  <ResourceActions
                    busy={statusLoadingId === resource.id}
                    onDeactivate={onDeactivate}
                    onEdit={onEdit}
                    onReactivate={onReactivate}
                    resource={resource}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {filteredResources.map((resource) => (
          <article
            className="rounded-md border border-border bg-white p-4 shadow-sm"
            key={resource.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-950">
                  {resource.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{resource.type}</p>
              </div>
              <ResourceStatusBadge isActive={resource.isActive} />
            </div>
            {resource.description ? (
              <p className="mt-3 text-sm leading-6 text-muted">
                {resource.description}
              </p>
            ) : null}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Location
                </dt>
                <dd className="mt-1 text-slate-800">
                  {resource.location ?? "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Capacity
                </dt>
                <dd className="mt-1 text-slate-800">
                  {resource.capacity ?? "Not set"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <ResourceActions
                busy={statusLoadingId === resource.id}
                onDeactivate={onDeactivate}
                onEdit={onEdit}
                onReactivate={onReactivate}
                resource={resource}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export function AdminResourceManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<{
    mode: ModalMode;
    resource: Resource | null;
  } | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Resource | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);

  async function loadResources() {
    setError("");

    try {
      const data = await parseResourceResponse(
        await fetch("/api/resources", { cache: "no-store" }),
      );
      setResources(data?.resources ?? []);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadResources();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => setSuccess(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const statusMatches =
        statusFilter === "all" ||
        (statusFilter === "active" && resource.isActive) ||
        (statusFilter === "inactive" && !resource.isActive);
      const queryMatches =
        !normalizedQuery ||
        resource.name.toLowerCase().includes(normalizedQuery) ||
        resource.type.toLowerCase().includes(normalizedQuery) ||
        (resource.location ?? "").toLowerCase().includes(normalizedQuery);

      return statusMatches && queryMatches;
    });
  }, [query, resources, statusFilter]);

  const counts = useMemo(
    () => ({
      active: resources.filter((resource) => resource.isActive).length,
      inactive: resources.filter((resource) => !resource.isActive).length,
      total: resources.length,
    }),
    [resources],
  );

  async function handleFormSubmit(values: ResourceFormValues) {
    if (!modal) return;

    setSaving(true);

    try {
      const response = await fetch(
        modal.mode === "create"
          ? "/api/resources"
          : `/api/resources/${modal.resource?.id}`,
        {
          body: JSON.stringify(toPayload(values)),
          headers: { "Content-Type": "application/json" },
          method: modal.mode === "create" ? "POST" : "PATCH",
        },
      );
      await parseResourceResponse(response);
      await loadResources();
      setModal(null);
      setSuccess(
        modal.mode === "create"
          ? "Resource created successfully."
          : "Resource updated successfully.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function setActiveState(resource: Resource, isActive: boolean) {
    setStatusLoadingId(resource.id);
    setError("");

    try {
      await parseResourceResponse(
        await fetch(`/api/resources/${resource.id}/status`, {
          body: JSON.stringify({ isActive }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
      );
      await loadResources();
      setConfirmDeactivate(null);
      setSuccess(
        isActive
          ? "Resource reactivated successfully."
          : "Resource deactivated successfully.",
      );
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setStatusLoadingId(null);
    }
  }

  const hasResources = resources.length > 0;
  const hasFilteredResults = filteredResources.length > 0;

  return (
    <section className="space-y-5" aria-labelledby="resource-inventory-title">
      <Card className="p-0">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                className="text-xl font-semibold tracking-tight text-slate-950"
                id="resource-inventory-title"
              >
                Resource inventory
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Search, edit, and control member visibility for reservable
                resources.
              </p>
            </div>
            <Button onClick={() => setModal({ mode: "create", resource: null })}>
              <PackagePlus aria-hidden="true" className="size-4" />
              Add resource
            </Button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <label className="sr-only" htmlFor="resource-search">
                Search resources
              </label>
              <input
                className="h-10 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                id="resource-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, type, or location"
                type="search"
                value={query}
              />
            </div>

            <div
              aria-label="Filter resources by status"
              className="inline-flex rounded-md border border-border bg-white p-1 shadow-sm"
              role="group"
            >
              {(["all", "active", "inactive"] as const).map((filter) => (
                <button
                  className={cn(
                    "h-8 rounded px-3 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    statusFilter === filter
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
          <div className="bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {counts.total}
            </p>
          </div>
          <div className="bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Active
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {counts.active}
            </p>
          </div>
          <div className="bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Inactive
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {counts.inactive}
            </p>
          </div>
        </div>

        <div aria-live="polite" className="sr-only" role="status">
          {success || error}
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
                onClick={() => {
                  setLoading(true);
                  void loadResources();
                }}
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
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  className="h-20 animate-pulse rounded-md border border-border bg-slate-100"
                  key={item}
                />
              ))}
            </div>
          ) : !hasResources ? (
            <EmptyState
              action={
                <Button onClick={() => setModal({ mode: "create", resource: null })}>
                  <PackagePlus aria-hidden="true" className="size-4" />
                  Add first resource
                </Button>
              }
              description="Create your first resource to make it available for future member-facing catalog and reservation flows."
              icon={PackagePlus}
              title="No resources yet"
            />
          ) : !hasFilteredResults ? (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                  }}
                  variant="secondary"
                >
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  Clear filters
                </Button>
              }
              description="No resources match the current search and status filter."
              icon={Search}
              title="No matching resources"
            />
          ) : (
            <ResourceInventory
              filteredResources={filteredResources}
              onDeactivate={setConfirmDeactivate}
              onEdit={(nextResource) =>
                setModal({ mode: "edit", resource: nextResource })
              }
              onReactivate={(nextResource) =>
                void setActiveState(nextResource, true)
              }
              statusLoadingId={statusLoadingId}
            />
          )}
        </div>
      </Card>

      {modal ? (
        <ResourceFormModal
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSubmit={handleFormSubmit}
          resource={modal.resource}
          saving={saving}
        />
      ) : null}

      {confirmDeactivate ? (
        <DeactivationDialog
          loading={statusLoadingId === confirmDeactivate.id}
          onCancel={() => setConfirmDeactivate(null)}
          onConfirm={() => void setActiveState(confirmDeactivate, false)}
          resource={confirmDeactivate}
        />
      ) : null}
    </section>
  );
}
