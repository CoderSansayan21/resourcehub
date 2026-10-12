import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Monitor,
  Search,
  UsersRound,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const instant = false;

const resourceCategories = [
  {
    title: "Meeting Rooms",
    description: "Find rooms for team meetings, interviews and focused sessions.",
    href: "/resources?type=meeting-room",
    icon: UsersRound,
  },
  {
    title: "Equipment",
    description: "Browse shared devices, presentation kits and workplace gear.",
    href: "/resources?type=equipment",
    icon: Monitor,
  },
  {
    title: "Shared Spaces",
    description: "Explore flexible areas for collaboration and daily work.",
    href: "/resources?type=shared-space",
    icon: BriefcaseBusiness,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
            Employee workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Find your next workspace.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Discover rooms, equipment and shared spaces in one place.
          </p>
        </div>
        <ButtonLink href="/availability" variant="secondary">
          View availability
          <ArrowRight aria-hidden="true" className="size-4" />
        </ButtonLink>
      </section>

      <Card className="p-6 sm:p-7">
        <CardHeader className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#E6F2F0] text-primary">
              <Search aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Search for a resource
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Choose your preferences to continue to resource discovery. Live
                availability matching will connect in a later stage.
              </p>
            </div>
          </div>
        </CardHeader>

        <form
          action="/resources"
          className="grid gap-4 lg:grid-cols-[1.35fr_1fr_0.9fr_0.9fr_auto]"
        >
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="resource-keyword"
            >
              Keyword
            </label>
            <input
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              id="resource-keyword"
              name="q"
              placeholder="Room, projector, desk"
              type="search"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="resource-type"
            >
              Type
            </label>
            <select
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              id="resource-type"
              name="type"
            >
              <option value="">Any resource</option>
              <option value="meeting-room">Meeting room</option>
              <option value="equipment">Equipment</option>
              <option value="shared-space">Shared space</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="date">
              Date
            </label>
            <input
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              id="date"
              name="date"
              type="date"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="time">
              Time
            </label>
            <input
              className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              id="time"
              name="time"
              type="time"
            />
          </div>

          <div className="flex items-end">
            <Button className="h-11 w-full px-5" type="submit">
              Search
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Browse by category
          </h2>
          <p className="mt-1 text-sm text-muted">
            Start with the resource type that best fits your booking need.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {resourceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                className="group rounded-lg border border-border bg-white p-5 shadow-sm shadow-slate-200/70 transition-colors hover:border-[#9CC8C3] hover:bg-[#FBFDFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href={category.href}
                key={category.title}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-md bg-[#E6F2F0] text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 size-4 text-slate-400 transition-colors group-hover:text-primary"
                  />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {category.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#E6F2F0] text-primary">
              <CalendarClock aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Upcoming Reservations
              </h2>
              <p className="text-sm text-muted">
                Your confirmed bookings will appear here once reservations are
                enabled.
              </p>
            </div>
          </div>
        </CardHeader>
        <EmptyState
          action={
            <ButtonLink href="/resources" variant="secondary">
              Explore resources
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          }
          description="You do not have any reservations yet. Start by browsing resources, then check availability before reserving."
          icon={CalendarClock}
          title="No upcoming reservations"
        />
      </Card>
    </div>
  );
}
