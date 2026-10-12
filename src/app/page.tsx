import { ArrowRight, Building2, CalendarCheck, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const pillars = [
  {
    title: "Discover resources",
    description: "Give teams a focused place to find rooms and shared equipment.",
    icon: Building2,
  },
  {
    title: "Plan around availability",
    description: "Make time slots visible before users commit to a reservation.",
    icon: CalendarCheck,
  },
  {
    title: "Scale with control",
    description: "Reserve space for administration, policies, and access control.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-[78vh] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
            Resource reservation management
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            ResourceHub
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            A polished workplace booking platform for finding resources,
            inspecting availability, and preparing reservations with confidence.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dashboard" size="lg">
              View dashboard preview
              <ArrowRight aria-hidden="true" className="size-5" />
            </ButtonLink>
            <ButtonLink href="/availability" size="lg" variant="secondary">
              See availability scaffold
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title}>
                <div className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">
                  {pillar.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {pillar.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
