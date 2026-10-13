import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, CalendarDays, Compass } from "lucide-react";
import { ReservationManager } from "@/components/reservation-manager";
import { requireUser } from "@/lib/authorization";
import { listReservationsForCurrentUser } from "@/lib/reservations";

export const instant = false;

export default async function ReservationsPage() {
  const [user, reservations] = await Promise.all([
    requireUser(),
    listReservationsForCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      <section className="relative isolate min-h-[240px] overflow-hidden rounded-[1.75rem] bg-[#063B3A] shadow-xl shadow-teal-950/10 sm:min-h-[260px]">
        <Image
          alt="A modern workplace ready for collaboration"
          className="object-cover object-center"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1100px"
          src="/images/reservations/reservations-hero.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#063B3A]/95 via-[#063B3A]/72 to-[#063B3A]/15" />
        <div className="relative flex min-h-[240px] max-w-2xl flex-col justify-center px-6 py-8 text-white sm:min-h-[260px] sm:px-10 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#BDEFE5]">
            {user.role === "ADMIN" ? "Reservation management" : "My reservations"}
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            {user.role === "ADMIN"
              ? "Manage reservations"
              : "Track your workplace reservations"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            {user.role === "ADMIN"
              ? "Monitor bookings across resources and keep reservation activity organized."
              : "Review upcoming bookings, update future reservations, and keep cancelled bookings in your history."}
          </p>
        </div>
      </section>

      <div className={user.role === "ADMIN" ? undefined : "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"}>
        <ReservationManager
          currentUserId={user.id}
          reservations={reservations}
          userRole={user.role}
        />

        {user.role === "MEMBER" ? <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#E8F7F3] text-[#087F73]">
                <Compass aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#087F73]">
                  Quick actions
                </p>
                <h2 className="mt-1 text-base font-bold text-[#102D2C]">
                  Keep moving
                </h2>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <Link
                className="group flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-semibold text-[#102D2C] transition hover:border-[#B5D2CE] hover:bg-[#F0FAF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]"
                href="/resources"
              >
                <span className="flex items-center gap-2.5">
                  <BookOpenCheck aria-hidden="true" className="size-4 text-[#087F73]" />
                  Browse resources
                </span>
                <ArrowUpRight aria-hidden="true" className="size-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#087F73]" />
              </Link>
              <Link
                className="group flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-semibold text-[#102D2C] transition hover:border-[#B5D2CE] hover:bg-[#F0FAF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]"
                href="/resources"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarDays aria-hidden="true" className="size-4 text-[#087F73]" />
                  Book a resource
                </span>
                <ArrowUpRight aria-hidden="true" className="size-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#087F73]" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#B5D2CE] bg-[#E8F7F3] p-5">
            <p className="text-sm font-bold text-[#063B3A]">A little planning goes a long way.</p>
            <p className="mt-2 text-sm leading-6 text-[#35625F]">
              Check availability before booking to find a time that works for your team.
            </p>
          </div>
        </aside> : null}
      </div>
    </div>
  );
}
