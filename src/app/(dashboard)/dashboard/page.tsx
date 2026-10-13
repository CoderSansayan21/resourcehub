import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DoorOpen,
  PackageSearch,
  UsersRound,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getDashboardData,
  type DashboardReservationSummary,
  type DashboardResourceSummary,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export const instant = false;

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateTime(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const date = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  }).format(start);
  const startLabel = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(end);

  return `${date}, ${startLabel} - ${endLabel}`;
}

function StatCard({
  description,
  icon: Icon,
  label,
  tone = "mint",
  value,
}: {
  description: string;
  icon: typeof PackageSearch;
  label: string;
  tone?: "mint" | "blue" | "teal";
  value: number;
}) {
  const toneClasses = {
    blue: "bg-sky-50 text-sky-700",
    mint: "bg-[#E8F7F3] text-[#087F73]",
    teal: "bg-[#087F73] text-white",
  };

  return (
    <Card className="group animate-[hero-rise_0.55s_ease-out_both] rounded-2xl border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 motion-reduce:animate-none motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#475569]">{label}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-[#102D2C]">
            {value.toLocaleString("en")}
          </p>
        </div>
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            toneClasses[tone],
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#475569]">{description}</p>
    </Card>
  );
}

function ReservationItem({
  reservation,
}: {
  reservation: DashboardReservationSummary;
}) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-200/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#102D2C]">
            {reservation.title}
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            {reservation.resource.name}
          </p>
          {reservation.resource.location ? (
            <p className="mt-1 text-xs font-medium text-[#64748B]">
              {reservation.resource.location}
            </p>
          ) : null}
        </div>
        <time
          className="text-sm font-semibold text-[#102D2C] sm:max-w-56 sm:text-right"
          dateTime={reservation.startTime}
        >
          {formatDateTime(reservation.startTime, reservation.endTime)}
        </time>
      </div>
    </li>
  );
}

function ResourceItem({ resource }: { resource: DashboardResourceSummary }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-200/70">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7F3] text-[#087F73]">
          <DoorOpen aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#102D2C]">{resource.name}</p>
          <p className="mt-1 text-sm text-[#475569]">{resource.type}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#475569]">
            {resource.location ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {resource.location}
              </span>
            ) : null}
            {resource.capacity ? (
              <span className="rounded-full bg-[#E8F7F3] px-2.5 py-1 text-[#087F73]">
                {pluralize(resource.capacity, "seat")}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function QuickActions() {
  const actions = [
    {
      description: "Search rooms, equipment and shared workspace assets.",
      href: "/resources",
      icon: PackageSearch,
      label: "Browse resources",
    },
    {
      description: "Review upcoming, past and cancelled reservations.",
      href: "/reservations",
      icon: ClipboardList,
      label: "View bookings",
    },
    {
      description: "Check confirmed bookings before choosing a time.",
      href: "/availability",
      icon: CalendarDays,
      label: "Check availability",
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">
          Shortcuts
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#102D2C]">
          Quick actions
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <ButtonLink
              className="group h-auto justify-start rounded-2xl border-slate-200 bg-white p-5 text-left text-[#102D2C] shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/80 motion-reduce:hover:translate-y-0"
              href={action.href}
              key={action.href}
              variant="secondary"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7F3] text-[#087F73]">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{action.label}</span>
                <span className="mt-1 block text-sm font-normal leading-6 text-[#475569]">
                  {action.description}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 text-[#087F73] transition group-hover:translate-x-1"
              />
            </ButtonLink>
          );
        })}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  const isAdmin = dashboard.currentUser.role === "ADMIN";
  const firstName = dashboard.currentUser.name.split(" ")[0] || "there";

  if (isAdmin) {
    return <AdminDashboard data={dashboard} />;
  }

  return (
    <div className="space-y-8">
      <section className="relative min-h-[300px] overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-slate-200/70">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 960px"
          src="/images/dashboard-hero.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#063B3A]/15 via-transparent to-transparent" />
        <div className="relative max-w-2xl px-6 py-9 sm:px-9 sm:py-12 lg:px-12">
          <div className="animate-[hero-rise_0.55s_ease-out_both] motion-reduce:animate-none">
            <p className="inline-flex rounded-full bg-[#E8F7F3] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#087F73]">
              {isAdmin ? "Admin dashboard" : "Member dashboard"}
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#102D2C] sm:text-5xl">
              Welcome back,{" "}
              <span className="text-[#087F73]">{firstName}</span>!
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#475569] sm:text-lg">
              Track your upcoming bookings and discover the resources you need
              for a productive workday.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/resources" className="rounded-full">
                Browse resources
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <ButtonLink
                href="/availability"
                variant="secondary"
                className="rounded-full border-slate-200 bg-white/90"
              >
                Check availability
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("grid gap-4", isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {isAdmin ? (
          <StatCard
            description="All resources in the catalog, active and inactive."
            icon={Building2}
            label="Total resources"
            tone="blue"
            value={dashboard.totalResourceCount ?? dashboard.activeResourceCount}
          />
        ) : null}
        <StatCard
          description={
            isAdmin
              ? "Resources currently visible for member bookings."
              : "Resources currently available in the member catalog."
          }
          icon={PackageSearch}
          label="Active resources"
          tone="teal"
          value={dashboard.activeResourceCount}
        />
        <StatCard
          description={
            isAdmin
              ? "Confirmed reservations with a future start time."
              : "Your confirmed reservations with a future start time."
          }
          icon={CalendarClock}
          label="Upcoming bookings"
          value={dashboard.upcomingConfirmedCount}
        />
      </section>

      <QuickActions />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-7">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">
                  Catalog
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#102D2C]">
                  Active resources
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#475569]">
                  Bookable resources currently available in ResourceHub.
                </p>
              </div>
              <ButtonLink href="/resources" size="sm" variant="secondary">
                View
              </ButtonLink>
            </div>
          </CardHeader>

          {dashboard.activeResources.length > 0 ? (
            <ul className="space-y-3">
              {dashboard.activeResources.map((resource) => (
                <ResourceItem key={resource.id} resource={resource} />
              ))}
            </ul>
          ) : (
            <EmptyState
              action={
                <ButtonLink href={isAdmin ? "/admin" : "/resources"} variant="secondary">
                  {isAdmin ? "Create a resource" : "Browse resources"}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
              }
              description={
                isAdmin
                  ? "No active resources are available for member booking. Add or reactivate resources in Administration."
                  : "There are no active resources available to book right now."
              }
              icon={PackageSearch}
              title="No active resources"
            />
          )}
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-7">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">
                  Reservations
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#102D2C]">
                  Upcoming bookings
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#475569]">
                  {isAdmin
                    ? `${pluralize(
                        dashboard.upcomingConfirmedCount,
                        "confirmed booking",
                      )} scheduled across ResourceHub.`
                    : `${pluralize(
                        dashboard.upcomingConfirmedCount,
                        "confirmed booking",
                      )} on your calendar.`}
                </p>
              </div>
              <ButtonLink href="/reservations" size="sm" variant="secondary">
                View
              </ButtonLink>
            </div>
          </CardHeader>

          {dashboard.nextReservation ? (
            <div className="mb-4 rounded-2xl border border-[#BDEFE5] bg-[#F0FAF8] p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#087F73]">
                  <CheckCircle2 aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087F73]">
                    Next up
                  </p>
                  <p className="mt-1 font-bold text-[#102D2C]">
                    {dashboard.nextReservation.title}
                  </p>
                  <time
                    className="mt-2 block text-sm font-semibold text-[#102D2C]"
                    dateTime={dashboard.nextReservation.startTime}
                  >
                    {formatDateTime(
                      dashboard.nextReservation.startTime,
                      dashboard.nextReservation.endTime,
                    )}
                  </time>
                </div>
              </div>
            </div>
          ) : null}

          {dashboard.upcomingReservations.length > 0 ? (
            <ul className="space-y-3">
              {dashboard.upcomingReservations.map((reservation) => (
                <ReservationItem key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          ) : (
            <EmptyState
              action={
                <ButtonLink
                  href={isAdmin ? "/availability" : "/resources"}
                  variant="secondary"
                >
                  {isAdmin ? "Inspect availability" : "Explore resources"}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
              }
              description={
                isAdmin
                  ? "There are no upcoming confirmed reservations across the workspace."
                  : "You do not have upcoming confirmed reservations yet. Browse resources or check availability to plan one."
              }
              icon={UsersRound}
              title="No upcoming bookings"
            />
          )}
        </Card>
      </section>
    </div>
  );
}
