import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Benefit = {
  icon: LucideIcon;
  label: string;
};

type AuthBackgroundShellProps = {
  badge: string;
  benefits: Benefit[];
  children: ReactNode;
  headline: ReactNode;
  mobileHeadline: string;
  supportingText: string;
};

export function AuthBackgroundShell({
  badge,
  benefits,
  children,
  headline,
  mobileHeadline,
  supportingText,
}: AuthBackgroundShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#063B3A] text-white">
      <Image
        src="/login-office.png"
        alt="Modern office lounge workspace"
        fill
        priority
        sizes="100vw"
        className="hero-reveal object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#031F1F]/94 via-[#063B3A]/74 to-[#063B3A]/16" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#031F1F]/58 via-transparent to-black/14" />

      <div className="relative z-10 grid min-h-screen px-4 py-6 sm:px-6 lg:grid-cols-[52fr_48fr] lg:px-10 xl:px-14">
        <section className="hidden min-h-[calc(100vh-3rem)] flex-col justify-between py-4 lg:flex">
          <Link
            aria-label="ResourceHub home"
            className="hero-reveal w-fit rounded-lg p-1 drop-shadow-[0_18px_38px_rgba(0,0,0,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BDEFE5]"
            href="/"
          >
            <Image
              src="/resourcehub-logo-new.png"
              alt="ResourceHub"
              width={2172}
              height={724}
              priority
              sizes="250px"
              className="h-16 w-auto object-contain"
            />
          </Link>

          <div className="max-w-2xl pb-8">
            <p className="hero-reveal text-sm font-bold uppercase tracking-[0.18em] text-[#BDEFE5]">
              {badge}
            </p>
            <h1 className="hero-reveal hero-reveal-delay-1 mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight xl:text-6xl">
              {headline}
            </h1>
            <p className="hero-reveal hero-reveal-delay-2 mt-6 max-w-xl text-lg leading-8 text-white/84">
              {supportingText}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    className={`hero-reveal rounded-full border border-white/20 bg-white/14 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur-md ${
                      index === 0
                        ? "hero-reveal-delay-1"
                        : index === 1
                          ? "hero-reveal-delay-2"
                          : "hero-reveal-delay-3"
                    }`}
                    key={benefit.label}
                  >
                    <span className="flex items-center gap-2">
                      <Icon aria-hidden="true" className="size-4 text-[#BDEFE5]" />
                      {benefit.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center py-4">
          <div className="w-full max-w-[28rem]">
            <div className="hero-reveal mb-6 flex flex-col items-center text-center lg:hidden">
              <Link
                aria-label="ResourceHub home"
                className="rounded-lg p-1 drop-shadow-[0_14px_30px_rgba(0,0,0,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BDEFE5]"
                href="/"
              >
                <Image
                  src="/resourcehub-logo-new.png"
                  alt="ResourceHub"
                  width={2172}
                  height={724}
                  priority
                  sizes="220px"
                  className="h-14 w-auto object-contain"
                />
              </Link>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#BDEFE5]">
                {badge}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                {mobileHeadline}
              </h1>
            </div>

            <div className="hero-reveal hero-reveal-delay-2 rounded-[1.75rem] border border-white/70 bg-white/90 p-6 text-[#102D2C] shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
