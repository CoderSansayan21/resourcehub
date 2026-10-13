import Image from "next/image";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Settings2,
  UsersRound,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  DashboardAdminReservationSummary,
  DashboardData,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

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

function AdminStatCard({
  description,
  icon: Icon,
  label,
  tone,
  value,
}: {
  description: string;
  icon: typeof Activity;
  label: string;
  tone: "blue" | "mint" | "slate" | "teal";
  value: number;
}) {
  const toneClasses = {
    blue: "bg-sky-50 text-sky-700",
    mint: "bg-[#E8F7F3] text-[#087F73]",
    slate: "bg-slate-100 text-slate-600",
    teal: "bg-[#087F73] text-white",
  };

  return (
    <Card className="group rounded-2xl border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#475569]">{label}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-[#102D2C]">
            {value.toLocaleString("en")}
          </p>
        </div>
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", toneClasses[tone])}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#475569]">{description}</p>
    </Card>
  );
}

function AdminQuickActions() {
  const actions = [
    {
      description: "Edit resources and control member visibility.",
      href: "/admin",
      icon: Settings2,
      label: "Manage resources",
    },
    {
      description: "Inspect workspace bookings and reservation history.",
      href: "/reservations",
      icon: ClipboardList,
      label: "Manage reservations",
    },
    {
      description: "Review confirmed blocks before making changes.",
      href: "/availability",
      icon: BarChart3,
      label: "Check availability",
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">
          Operations
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#102D2C]">
          Quick actions
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <ButtonLink
              className="group h-full items-start justify-start rounded-2xl border-slate-200 bg-white p-5 text-left text-[#102D2C] shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/80 motion-reduce:hover:translate-y-0"
              href={action.href}
              key={action.label}
              variant="secondary"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7F3] text-[#087F73]">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{action.label}</span>
                <span className="mt-1 block text-sm font-normal leading-6 text-[#475569]">
                  {action.description}
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-[#087F73] transition group-hover:translate-x-1" />
            </ButtonLink>
          );
        })}
      </div>
    </section>
  );
}

function ReservationStatus({ status }: { status: DashboardAdminReservationSummary["status"] }) {
  const cancelled = status === "CANCELLED";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        cancelled
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <span className={cn("size-1.5 rounded-full", cancelled ? "bg-slate-400" : "bg-emerald-500")} />
      {cancelled ? "Cancelled" : "Confirmed"}
    </span>
  );
}

function RecentReservationItem({ reservation }: { reservation: DashboardAdminReservationSummary }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-[#102D2C]">{reservation.title}</p>
            <ReservationStatus status={reservation.status} />
          </div>
          <p className="mt-1 text-sm font-semibold text-[#087F73]">
            {reservation.resource.name}
          </p>
          <p className="mt-1 truncate text-xs text-[#64748B]">
            {reservation.user.name} · {reservation.user.email}
          </p>
        </div>
        <time
          className="shrink-0 text-sm font-semibold text-[#102D2C] sm:max-w-52 sm:text-right"
          dateTime={reservation.startTime}
        >
          {formatDateTime(reservation.startTime, reservation.endTime)}
        </time>
      </div>
    </li>
  );
}

function ResourcesByStatus({ data }: { data: DashboardData }) {
  const active = data.activeResourceCount;
  const inactive = data.inactiveResourceCount ?? 0;
  const total = data.totalResourceCount ?? active + inactive;
  const activePercent = total > 0 ? (active / total) * 100 : 0;
  const inactivePercent = total > 0 ? (inactive / total) * 100 : 0;

  return (
    <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-7">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">
        Inventory health
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#102D2C]">
        Resources by status
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#475569]">
        Keep the member catalog focused on resources that are ready to book.
      </p>

      {total > 0 ? (
        <div className="mt-8 space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#102D2C]">Active resources</span>
              <span className="font-bold text-[#087F73]">{active} · {Math.round(activePercent)}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#087F73] transition-[width] duration-500" style={{ width: `${activePercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#102D2C]">Inactive resources</span>
              <span className="font-bold text-slate-500">{inactive} · {Math.round(inactivePercent)}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-400 transition-[width] duration-500" style={{ width: `${inactivePercent}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-[#F8FAF9] p-5 text-sm leading-6 text-[#475569]">
          No resources have been added yet. Add the first resource to begin building the workspace catalog.
        </div>
      )}

      <ButtonLink className="mt-7" href="/admin" size="sm" variant="secondary">
        Open resource management
        <ArrowRight aria-hidden="true" className="size-4" />
      </ButtonLink>
    </Card>
  );
}

export function AdminDashboard({ data }: { data: DashboardData }) {
  const recentReservations = data.recentReservations ?? [];

  return (
    <div className="space-y-8">
      <section className="relative min-h-[310px] overflow-hidden rounded-[2rem] border border-[#0A4D4A] bg-[#063B3A] shadow-2xl shadow-teal-950/15">
        <Image
          alt="A modern workplace operations environment"
          className="object-cover object-center"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1100px"
          src="/images/admin/admin-hero.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#063B3A]/98 via-[#063B3A]/78 to-[#063B3A]/15" />
        <div className="relative flex min-h-[310px] max-w-2xl flex-col justify-center px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#BDEFE5]">
            Admin control center
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Manage your workspace resources
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            Monitor resources, oversee reservations, and keep your workspace organized and efficient.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          description="Active and inactive resources in the catalog."
          icon={BarChart3}
          label="Total resources"
          tone="blue"
          value={data.totalResourceCount ?? 0}
        />
        <AdminStatCard
          description="Resources currently visible for member bookings."
          icon={CheckCircle2}
          label="Active resources"
          tone="teal"
          value={data.activeResourceCount}
        />
        <AdminStatCard
          description="Resources paused from the member catalog."
          icon={Settings2}
          label="Inactive resources"
          tone="slate"
          value={data.inactiveResourceCount ?? 0}
        />
        <AdminStatCard
          description="Confirmed reservations with a future start time."
          icon={CalendarClock}
          label="Upcoming bookings"
          tone="mint"
          value={data.upcomingConfirmedCount}
        />
      </section>

      <AdminQuickActions />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">Workspace activity</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#102D2C]">Recent reservations</h2>
              <p className="mt-1 text-sm leading-6 text-[#475569]">Latest bookings across the workspace.</p>
            </div>
            <ButtonLink href="/reservations" size="sm" variant="secondary">View all</ButtonLink>
          </div>
          {recentReservations.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {recentReservations.map((reservation) => (
                <RecentReservationItem key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          ) : (
            <div className="mt-6">
              <EmptyState
                description="Reservations will appear here as members book workspace resources."
                icon={ClipboardList}
                title="No reservations yet"
              />
            </div>
          )}
        </Card>

        <ResourcesByStatus data={data} />
      </section>

      <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#087F73]">Planning horizon</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#102D2C]">Upcoming bookings</h2>
            <p className="mt-1 text-sm leading-6 text-[#475569]">The nearest confirmed reservations across ResourceHub.</p>
          </div>
          <ButtonLink href="/reservations" size="sm" variant="secondary">Manage</ButtonLink>
        </div>
        {data.upcomingReservations.length > 0 ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.upcomingReservations.map((reservation) => (
              <div className="rounded-2xl border border-[#BDEFE5] bg-[#F0FAF8] p-4" key={reservation.id}>
                <div className="flex items-center gap-2 text-[#087F73]">
                  <UsersRound aria-hidden="true" className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.12em]">Confirmed</span>
                </div>
                <p className="mt-3 truncate font-bold text-[#102D2C]">{reservation.resource.name}</p>
                <p className="mt-1 truncate text-sm text-[#475569]">{reservation.title}</p>
                <time className="mt-3 block text-xs font-semibold leading-5 text-[#35625F]" dateTime={reservation.startTime}>
                  {formatDateTime(reservation.startTime, reservation.endTime)}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              action={<ButtonLink href="/availability" variant="secondary">Inspect availability</ButtonLink>}
              description="There are no upcoming confirmed reservations across the workspace."
              icon={CalendarClock}
              title="No upcoming bookings"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
