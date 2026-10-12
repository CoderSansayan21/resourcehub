import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  PackageSearch,
  Settings,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getDashboardData,
  type DashboardReservationSummary,
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
  label,
  tone = "default",
  value,
}: {
  description: string;
  label: string;
  tone?: "default" | "primary";
  value: number;
}) {
  return (
    <Card
      className={cn(
        "p-5",
        tone === "primary" ? "border-[#9CC8C3] bg-[#F0FAF8]" : "bg-white",
      )}
    >
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value.toLocaleString("en")}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </Card>
  );
}

function ReservationItem({
  reservation,
}: {
  reservation: DashboardReservationSummary;
}) {
  return (
    <li className="rounded-md border border-border bg-white px-4 py-3 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{reservation.title}</p>
          <p className="mt-1 text-sm text-muted">{reservation.resource.name}</p>
          {reservation.resource.location ? (
            <p className="mt-1 text-xs text-muted">
              {reservation.resource.location}
            </p>
          ) : null}
        </div>
        <time
          className="text-sm font-medium text-slate-700 sm:text-right"
          dateTime={reservation.startTime}
        >
          {formatDateTime(reservation.startTime, reservation.endTime)}
        </time>
      </div>
    </li>
  );
}

function QuickActions({ role }: { role: "ADMIN" | "MEMBER" }) {
  const actions =
    role === "ADMIN"
      ? [
          {
            description: "Manage resource inventory and activation status.",
            href: "/admin",
            icon: Settings,
            label: "Admin resources",
          },
          {
            description: "Inspect confirmed blocks before advising teams.",
            href: "/availability",
            icon: CalendarDays,
            label: "Availability",
          },
          {
            description: "Review reservation activity across ResourceHub.",
            href: "/reservations",
            icon: ClipboardList,
            label: "Reservations",
          },
        ]
      : [
          {
            description: "Browse active rooms, equipment and spaces.",
            href: "/resources",
            icon: PackageSearch,
            label: "Find resources",
          },
          {
            description: "Check confirmed bookings before choosing a time.",
            href: "/availability",
            icon: CalendarDays,
            label: "View availability",
          },
          {
            description: "See upcoming, past and cancelled bookings.",
            href: "/reservations",
            icon: ClipboardList,
            label: "My reservations",
          },
        ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Quick actions
        </h2>
        <p className="mt-1 text-sm text-muted">
          Jump into the workflows most useful from this dashboard.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <ButtonLink
              className="h-auto justify-start rounded-lg border-border bg-white p-5 text-left text-slate-900 shadow-sm shadow-slate-200/70 hover:bg-[#FBFDFC]"
              href={action.href}
              key={action.href}
              variant="secondary"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#E6F2F0] text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{action.label}</span>
                <span className="mt-1 block text-sm font-normal leading-6 text-muted">
                  {action.description}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="ml-auto size-4 shrink-0 text-slate-400"
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

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
            {isAdmin ? "Administrator dashboard" : "Employee workspace"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {isAdmin
              ? "ResourceHub operations at a glance."
              : `Welcome back, ${dashboard.currentUser.name}.`}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            {isAdmin
              ? "Monitor real resource inventory and upcoming confirmed reservations across the workspace."
              : "Track your upcoming bookings and jump back into resource discovery when you need a room, space or shared asset."}
          </p>
        </div>
        <ButtonLink href={isAdmin ? "/admin" : "/resources"} variant="secondary">
          {isAdmin ? "Manage resources" : "Browse resources"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </ButtonLink>
      </section>

      <section className={cn("grid gap-4", isAdmin ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {isAdmin ? (
          <StatCard
            description="All resources in the catalog, active and inactive."
            label="Total resources"
            value={dashboard.totalResourceCount ?? dashboard.activeResourceCount}
          />
        ) : null}
        <StatCard
          description={
            isAdmin
              ? "Resources currently visible for member bookings."
              : "Resources currently available in the member catalog."
          }
          label="Active resources"
          tone="primary"
          value={dashboard.activeResourceCount}
        />
        <StatCard
          description={
            isAdmin
              ? "Confirmed reservations with a future start time."
              : "Your confirmed reservations with a future start time."
          }
          label={isAdmin ? "Upcoming confirmed" : "Your upcoming bookings"}
          value={dashboard.upcomingConfirmedCount}
        />
      </section>

      {dashboard.activeResourceCount === 0 ? (
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
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6 sm:p-7">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#E6F2F0] text-primary">
                <CalendarClock aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  {isAdmin ? "Next system booking" : "Next reservation"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {isAdmin
                    ? "The next confirmed reservation scheduled across all resources."
                    : "Your next confirmed reservation, excluding cancelled or past bookings."}
                </p>
              </div>
            </div>
          </CardHeader>

          {dashboard.nextReservation ? (
            <div className="rounded-lg border border-[#B5D2CE] bg-[#F0FAF8] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <div>
                  <p className="text-lg font-semibold text-slate-950">
                    {dashboard.nextReservation.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {dashboard.nextReservation.resource.name}
                  </p>
                  <time
                    className="mt-3 block text-sm font-medium text-slate-900"
                    dateTime={dashboard.nextReservation.startTime}
                  >
                    {formatDateTime(
                      dashboard.nextReservation.startTime,
                      dashboard.nextReservation.endTime,
                    )}
                  </time>
                  {dashboard.nextReservation.resource.location ? (
                    <p className="mt-2 text-sm text-muted">
                      {dashboard.nextReservation.resource.location}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
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
              icon={CalendarClock}
              title="No upcoming reservations"
            />
          )}
        </Card>

        <Card className="p-6 sm:p-7">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  {isAdmin ? "Upcoming reservation activity" : "Upcoming reservations"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
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
                View all
              </ButtonLink>
            </div>
          </CardHeader>

          {dashboard.upcomingReservations.length > 0 ? (
            <ul className="space-y-3">
              {dashboard.upcomingReservations.map((reservation) => (
                <ReservationItem key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <LayoutDashboard
                aria-hidden="true"
                className="mx-auto size-8 text-primary"
              />
              <h3 className="mt-4 font-semibold text-slate-950">
                Nothing scheduled yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                {isAdmin
                  ? "Upcoming confirmed reservations will appear here as members book resources."
                  : "Your future confirmed bookings will appear here. Cancelled and past reservations stay in reservation history."}
              </p>
            </div>
          )}
        </Card>
      </section>

      <QuickActions role={dashboard.currentUser.role} />
    </div>
  );
}