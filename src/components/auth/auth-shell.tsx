import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarCheck, ShieldCheck } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
};

export function AuthShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#F8FAF9] text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1fr_0.92fr]">
        <section className="flex min-h-[34rem] flex-col justify-between bg-[#063B3A] px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-12">
          <Link
            className="w-fit rounded-md text-xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            href="/"
          >
            ResourceHub
          </Link>

          <div className="max-w-xl py-12">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#BFE4DF]">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-7 text-[#D9EFEC] sm:text-lg">
              {description}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-[#D9EFEC] sm:grid-cols-2">
            <div className="rounded-md border border-white/15 bg-white/10 p-4">
              <CalendarCheck aria-hidden="true" className="size-5 text-[#9CE1D8]" />
              <p className="mt-3 font-medium text-white">Plan confidently</p>
              <p className="mt-1 leading-6">
                Find workplace resources and prepare reservations in one focused
                workspace.
              </p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 p-4">
              <ShieldCheck aria-hidden="true" className="size-5 text-[#9CE1D8]" />
              <p className="mt-3 font-medium text-white">Access with control</p>
              <p className="mt-1 leading-6">
                Member accounts are created securely through the ResourceHub
                auth system.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-border bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-8">
              {children}
            </div>
            <div className="mt-6 text-center text-sm text-muted">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
