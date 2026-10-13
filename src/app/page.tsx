import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Menu,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

const audiences = [
  {
    title: "Employees",
    description:
      "Discover resources, check availability and manage personal bookings.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Team Managers",
    description:
      "Coordinate their own bookings and check resource availability.",
    icon: UsersRound,
  },
  {
    title: "Administrators",
    description: "Manage shared resources and oversee reservations.",
    icon: ShieldCheck,
  },
];

const steps = [
  {
    title: "Search resources",
    description: "Browse shared rooms, spaces and equipment in one place.",
    icon: Search,
  },
  {
    title: "Check availability",
    description: "Review open time slots before planning your booking.",
    icon: CalendarCheck,
  },
  {
    title: "Book your resource",
    description: "Reserve the resource you need and keep work moving.",
    icon: CheckCircle2,
  },
];

const heroInfoCards = [
  {
    title: "Reserve Rooms",
    description: "Find the right space quickly.",
    icon: BriefcaseBusiness,
    className: "left-4 top-8",
  },
  {
    title: "Real-time Availability",
    description: "See open slots before booking.",
    icon: CalendarCheck,
    className: "right-4 top-1/2 -translate-y-1/2",
  },
  {
    title: "Built for Teams",
    description: "Coordinate shared resources.",
    icon: UsersRound,
    className: "bottom-5 left-10",
  },
];

const benefits = [
  { label: "Easy booking", icon: CheckCircle2 },
  { label: "Real-time availability", icon: CalendarCheck },
  { label: "Built for teams", icon: UsersRound },
];

function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="flex shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          aria-label="ResourceHub home"
        >
          <Image
            src="/resourcehub-logo-new.png"
            alt="ResourceHub"
            width={2172}
            height={724}
            priority
            sizes="190px"
            className="h-[3.25rem] w-auto object-contain sm:h-14"
          />
        </Link>

        <div className="hidden items-center gap-9 rounded-full border border-slate-200/80 bg-white/75 px-6 py-3 shadow-sm shadow-slate-900/5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md text-sm font-medium text-slate-600 transition hover:text-[#063B3A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-[#063B3A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white shadow-sm shadow-teal-950/15 transition hover:bg-[#066B62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Get started
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-slate-200 bg-white text-[#063B3A] shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Open navigation menu</span>
          </summary>
          <div className="absolute right-0 mt-3 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
            <div className="flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#063B3A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-teal-950/15 hover:bg-[#066B62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Get started
              </Link>
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen scroll-pt-24 overflow-hidden bg-[#F8FAF9] text-slate-950">
      <PublicNav />

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-18">
        <div className="pointer-events-none absolute -right-28 top-16 h-80 w-80 rounded-full bg-[#A7E4DC]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-6 h-72 w-72 rounded-full bg-[#C8F1E9]/40 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <p className="hero-reveal text-sm font-bold uppercase tracking-[0.16em] text-primary">
            Resource reservation management
          </p>
          <h1 className="hero-reveal hero-reveal-delay-1 mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight text-[#063B3A] sm:text-6xl lg:text-[4.8rem]">
            <span className="block">Find. Book.</span>
            <span className="block">
              Work Better{" "}
              <span className="text-primary">Together.</span>
            </span>
          </h1>
          <p className="hero-reveal hero-reveal-delay-2 mt-6 max-w-[36rem] text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            Discover and reserve shared workplace resources with a simple,
            reliable platform built for focused teams and modern offices.
          </p>
          <div className="hero-reveal hero-reveal-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-7 text-base font-semibold text-white shadow-lg shadow-teal-950/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#066B62] hover:shadow-xl hover:shadow-teal-950/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-7 text-base font-semibold text-[#063B3A] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Sign in
            </Link>
          </div>

          <div className="hero-reveal hero-reveal-delay-3 mt-8 grid gap-3 text-sm font-semibold text-[#063B3A] sm:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.label}
                  className="flex items-center gap-2 rounded-full border border-[#BDE5DF] bg-white/70 px-4 py-2.5 shadow-sm shadow-slate-900/5"
                >
                  <Icon aria-hidden="true" className="size-4 text-primary" />
                  <span>{benefit.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hero-reveal hero-reveal-delay-2 relative z-10">
          <div className="absolute -inset-5 rounded-[2.25rem] bg-[#BFEADF]/55 blur-2xl" />
          <div className="absolute -right-7 -top-7 hidden h-32 w-32 rounded-full bg-[#087F73]/15 blur-2xl sm:block" />
          <div className="group relative overflow-hidden rounded-[2rem] border-[10px] border-white bg-white shadow-[0_30px_80px_rgba(6,59,58,0.18)]">
            <Image
              src="/homepage-hero.png"
              alt="A bright modern meeting room with shared workplace resources"
              width={1536}
              height={1024}
              priority
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="aspect-[1.16/1] h-auto w-full object-cover transition duration-700 group-hover:scale-[1.025]"
            />
          </div>

          <div aria-hidden="true" className="pointer-events-none hidden lg:block">
            {heroInfoCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`absolute ${card.className} flex w-56 items-start gap-3 rounded-xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-teal-950/10 backdrop-blur`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F3F1] text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#063B3A]">
                      {card.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {card.description}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-reveal bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.98fr_1.02fr] lg:gap-16">
            <div className="overflow-hidden rounded-[1.5rem] border-[8px] border-[#F8FAF9] bg-white shadow-2xl shadow-slate-900/10">
              <Image
                src="/homepage-teamwork.png"
                alt="A workplace team collaborating around a laptop"
                width={1672}
                height={941}
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="aspect-[1.35/1] h-auto w-full object-cover"
              />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                For every shared workplace
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#063B3A] sm:text-4xl">
                Built for Your Workplace
              </h2>
              <div className="mt-8 grid gap-4">
                {audiences.map((audience) => {
                  const Icon = audience.icon;
                  return (
                    <section
                      key={audience.title}
                      className="flex gap-4 rounded-xl border border-slate-200 bg-[#F8FAF9] p-5 shadow-sm shadow-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm shadow-slate-200">
                        <Icon aria-hidden="true" className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#063B3A]">
                          {audience.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {audience.description}
                        </p>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-reveal py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#063B3A] sm:text-4xl">
              Reserve resources in three simple steps
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <section
                  key={step.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-200/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[#E8F3F1] text-primary">
                    <Icon aria-hidden="true" className="size-6" />
                  </div>
                  <p className="mt-5 text-sm font-bold text-primary">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#063B3A]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="space-y-2">
            <Image
              src="/resourcehub-logo-new.png"
              alt="ResourceHub"
              width={2172}
              height={724}
              sizes="190px"
              className="h-12 w-auto object-contain"
            />
            <p className="text-sm font-medium text-[#063B3A]">
              Find. Book. Work Better Together.
            </p>
          </div>
          <p>&copy; 2026 ResourceHub. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
