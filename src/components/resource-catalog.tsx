"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  Cpu,
  DoorOpen,
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
import {
  getResourceCategoryValue,
  getResourceCategoryLabel,
  RESOURCE_CATEGORIES,
  type ResourceCategoryValue,
} from "@/lib/resource-categories";

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
  initialCategory?: string;
  initialQuery?: string;
  initialType?: string;
  resources: Resource[];
  userRole: "ADMIN" | "MEMBER";
};

const CATEGORY_ICONS: Record<ResourceCategoryValue, typeof DoorOpen> = {
  "computer-labs": Cpu,
  equipment: PackageSearch,
  "meeting-rooms": DoorOpen,
  others: Boxes,
  workspaces: BriefcaseBusiness,
};

const OTHER_CATEGORY = "other";

function categoryLabel(value: string) {
  if (value === OTHER_CATEGORY) return "Other resources";
  return RESOURCE_CATEGORIES.find((category) => category.value === value)?.label ?? value;
}

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
          <p className="text-sm font-semibold text-[#087F73]">
            {getResourceCategoryLabel(resource.type)}
          </p>
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

function CategoryCard({
  count,
  description,
  image,
  label,
  value,
}: {
  count: number;
  description: string;
  image?: string;
  label: string;
  value: string;
}) {
  const Icon = value === OTHER_CATEGORY ? PackageSearch : CATEGORY_ICONS[value as ResourceCategoryValue];
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition duration-300 hover:-translate-y-1 hover:border-[#B5D2CE] hover:shadow-lg hover:shadow-teal-950/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]",
        value === "others" && "sm:col-span-2",
      )}
      href={`/resources?category=${encodeURIComponent(value)}`}
    >
      <div className="relative h-44 overflow-hidden bg-[#E8F7F3] sm:h-48">
        {image && !imageFailed ? (
          <Image
            alt={`${label} category`}
            className="object-cover transition duration-500 group-hover:scale-105"
            fill
            onError={() => setImageFailed(true)}
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
            src={image}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#087F73]">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/75 shadow-sm">
              <Icon aria-hidden="true" className="size-7" />
            </span>
          </div>
        )}
        <span className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-bold text-[#063B3A] shadow-sm backdrop-blur-sm">
          {count} active
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#E8F7F3] text-[#087F73]">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <h3 className="mt-4 text-xl font-bold tracking-tight text-[#102D2C]">{label}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>
        <span className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#063B3A] px-4 text-sm font-bold text-white transition-colors group-hover:bg-[#087F73]">
          Browse
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function ResourceCatalog({
  initialCategory,
  initialQuery,
  initialType,
  resources,
  userRole,
}: ResourceCatalogProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [type, setType] = useState(initialType ?? "");
  const category = initialCategory ?? "";

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
    const normalizedCategory = normalize(category);

    return resources.filter((resource) => {
      const typeMatches =
        !normalizedType || normalize(resource.type) === normalizedType;
      const resourceCategory = getResourceCategoryValue(resource.type);
      const categoryMatches =
        !normalizedCategory ||
        (normalizedCategory === OTHER_CATEGORY
          ? resourceCategory === null
          : resourceCategory === normalizedCategory);
      const queryMatches =
        !normalizedQuery ||
        normalize(resource.name).includes(normalizedQuery) ||
        normalize(resource.type).includes(normalizedQuery) ||
        normalize(resource.location).includes(normalizedQuery);

      return categoryMatches && typeMatches && queryMatches;
    });
  }, [category, query, resources, type]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const resource of resources) {
      if (!resource.isActive) continue;
      const value = getResourceCategoryValue(resource.type) ?? OTHER_CATEGORY;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return counts;
  }, [resources]);

  const hasFilteredResources = filteredResources.length > 0;
  const showInactiveStatus =
    userRole === "ADMIN" && resources.some((resource) => !resource.isActive);
  const selectedCategory = category
    ? categoryLabel(category)
    : undefined;
  const isCategoryLanding = !category && !query.trim() && !type;
  const categoryCards = [
    ...RESOURCE_CATEGORIES,
    ...(categoryCounts.has(OTHER_CATEGORY)
      ? [
          {
            description: "Existing resources with a legacy type are kept discoverable here.",
            label: "Other resources",
            value: OTHER_CATEGORY,
          },
        ]
      : []),
  ];

  return (
    <section className="space-y-6" aria-labelledby="resource-catalog-title">
      {isCategoryLanding ? (
        <>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">
              Explore by category
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#102D2C]" id="resource-catalog-title">
              Find the right resource
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Choose a category to browse active resources, compare details, and plan your next booking.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {categoryCards.map((item) => (
              <CategoryCard
                count={categoryCounts.get(item.value) ?? 0}
                description={item.description}
                image={"image" in item ? item.image : undefined}
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Link className="text-sm font-bold text-[#087F73] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]" href="/resources">
                  ← All categories
                </Link>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#102D2C]" id="resource-catalog-title">
                  {selectedCategory ?? "Resource search"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {selectedCategory
                    ? `Browse active resources in ${selectedCategory}.`
                    : "Search all active resources across ResourceHub."}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                Showing {filteredResources.length} of {resources.length}
              </p>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <label className="sr-only" htmlFor="resource-search">Search resources</label>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAF9] pl-9 pr-3 text-sm text-[#102D2C] shadow-inner shadow-slate-200/30 placeholder:text-slate-500 focus:border-[#087F73] focus:bg-white focus:outline-2 focus:outline-offset-2 focus:outline-[#087F73]"
                  id="resource-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={selectedCategory ? `Search ${selectedCategory.toLowerCase()}` : "Search by name, type, or location"}
                  type="search"
                  value={query}
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="resource-type-filter">Filter by resource type</label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 text-sm font-semibold text-[#102D2C] shadow-inner shadow-slate-200/30 focus:border-[#087F73] focus:bg-white focus:outline-2 focus:outline-offset-2 focus:outline-[#087F73]"
                  id="resource-type-filter"
                  onChange={(event) => setType(event.target.value)}
                  value={type}
                >
                  <option value="">All resource types</option>
                  {resourceTypes.map((resourceType) => (
                    <option key={resourceType} value={resourceType}>{getResourceCategoryLabel(resourceType)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!hasFilteredResources ? (
            <EmptyState
              action={
                <Button onClick={() => { setQuery(""); setType(""); }} type="button" variant="secondary">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  Clear filters
                </Button>
              }
              description={category ? "Try another keyword or clear the category filters to continue browsing." : "Try a different keyword or resource type."}
              icon={category ? PackageSearch : Search}
              title={category ? "No resources in this category yet." : "No matching resources"}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} showInactiveStatus={showInactiveStatus} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
