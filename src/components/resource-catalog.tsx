"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  PackageSearch,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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

type ResourceCatalogProps = {
  initialQuery?: string;
  initialType?: string;
  resources: Resource[];
  userRole: "ADMIN" | "MEMBER";
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function ResourceStatus({ resource }: { resource: Resource }) {
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

function ResourceCard({
  resource,
  showInactiveStatus,
}: {
  resource: Resource;
  showInactiveStatus: boolean;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border bg-white p-5 shadow-sm shadow-slate-200/70 transition-colors",
        resource.isActive
          ? "border-border hover:border-[#9CC8C3]"
          : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">{resource.type}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {resource.name}
          </h2>
        </div>
        {showInactiveStatus || !resource.isActive ? (
          <ResourceStatus resource={resource} />
        ) : (
          <CheckCircle2
            aria-label="Active resource"
            className="size-5 shrink-0 text-emerald-600"
          />
        )}
      </div>

      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted">
        {resource.description ??
          "No description has been added for this resource yet."}
      </p>

      <dl className="mt-5 grid gap-3 text-sm">
        {resource.location ? (
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin aria-hidden="true" className="size-4 text-muted" />
            <dt className="sr-only">Location</dt>
            <dd>{resource.location}</dd>
          </div>
        ) : null}
        {resource.capacity ? (
          <div className="flex items-center gap-2 text-slate-700">
            <UsersRound aria-hidden="true" className="size-4 text-muted" />
            <dt className="sr-only">Capacity</dt>
            <dd>
              {resource.capacity}{" "}
              {resource.capacity === 1 ? "person" : "people"}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto pt-6">
        <Link
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href={`/resources/${resource.id}`}
        >
          View details
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function ResourceCatalog({
  initialQuery,
  initialType,
  resources,
  userRole,
}: ResourceCatalogProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [type, setType] = useState(initialType ?? "");

  const resourceTypes = useMemo(
    () =>
      Array.from(new Set(resources.map((resource) => resource.type))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [resources],
  );

  const filteredResources = useMemo(() => {
    const normalizedQuery = normalize(query);
    const normalizedType = normalize(type);

    return resources.filter((resource) => {
      const typeMatches =
        !normalizedType || normalize(resource.type) === normalizedType;
      const queryMatches =
        !normalizedQuery ||
        normalize(resource.name).includes(normalizedQuery) ||
        normalize(resource.type).includes(normalizedQuery) ||
        normalize(resource.location).includes(normalizedQuery);

      return typeMatches && queryMatches;
    });
  }, [query, resources, type]);

  const hasResources = resources.length > 0;
  const hasFilteredResources = filteredResources.length > 0;
  const showInactiveStatus =
    userRole === "ADMIN" && resources.some((resource) => !resource.isActive);

  return (
    <section className="space-y-5" aria-labelledby="resource-catalog-title">
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              className="text-xl font-semibold tracking-tight text-slate-950"
              id="resource-catalog-title"
            >
              Resource catalog
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {userRole === "ADMIN"
                ? "Admins can see active and inactive resources here. Management actions stay in Administration."
                : "Only active resources are shown in this catalog."}
            </p>
          </div>
          <p className="text-sm font-medium text-muted">
            Showing {filteredResources.length} of {resources.length}
          </p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_16rem]">
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

          <div>
            <label className="sr-only" htmlFor="resource-type-filter">
              Filter by resource type
            </label>
            <select
              className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              id="resource-type-filter"
              onChange={(event) => setType(event.target.value)}
              value={type}
            >
              <option value="">All resource types</option>
              {resourceTypes.map((resourceType) => (
                <option key={resourceType} value={resourceType}>
                  {resourceType}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!hasResources ? (
        <EmptyState
          description={
            userRole === "ADMIN"
              ? "No resources exist yet. Use Administration to create the first resource."
              : "No active resources are available yet. Please check back after an administrator publishes resources."
          }
          icon={PackageSearch}
          title="No resources available"
        />
      ) : !hasFilteredResources ? (
        <EmptyState
          action={
            <Button
              onClick={() => {
                setQuery("");
                setType("");
              }}
              type="button"
              variant="secondary"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Clear filters
            </Button>
          }
          description="Try a different keyword or resource type."
          icon={Search}
          title="No matching resources"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              showInactiveStatus={showInactiveStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}
