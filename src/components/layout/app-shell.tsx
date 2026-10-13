"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { NavItem } from "@/components/layout/nav-item";
import { getNavigationGroups } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type AppShellUser = {
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
};

type AppShellProps = {
  children: React.ReactNode;
  user: AppShellUser;
};

function Brand() {
  return (
    <Link
      className="flex w-fit rounded-2xl bg-white/95 p-2.5 shadow-lg shadow-black/15 ring-1 ring-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BDEFE5]"
      href="/dashboard"
      aria-label="ResourceHub dashboard"
    >
      <Image
        src="/resourcehub-logo-new.png"
        alt="ResourceHub"
        width={2172}
        height={724}
        priority
        sizes="180px"
        className="h-11 w-auto object-contain"
      />
    </Link>
  );
}

function ResourceSearchForm({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    router.push(
      trimmedQuery ? `/resources?q=${encodeURIComponent(trimmedQuery)}` : "/resources",
    );
  }

  return (
    <form
      aria-label="Search resources"
      className={cn("w-full max-w-xl", className)}
      onSubmit={handleSubmit}
      role="search"
    >
      <div className="group flex h-12 items-center rounded-full border border-slate-200 bg-white px-2 shadow-sm shadow-slate-200/70 transition focus-within:border-[#087F73] focus-within:ring-4 focus-within:ring-[#087F73]/10">
        <button
          aria-label="Search resources"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-[#E8F7F3] hover:text-[#087F73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F73]"
          type="submit"
        >
          <Search aria-hidden="true" className="size-4" />
        </button>
        <input
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-[#102D2C] outline-none placeholder:text-slate-500"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search resources (e.g. meeting room, projector...)"
          type="search"
          value={query}
        />
      </div>
    </form>
  );
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RH";
}

function SidebarNav({
  onNavigate,
  user,
}: {
  onNavigate?: () => void;
  user: AppShellUser;
}) {
  const navigationGroups = getNavigationGroups(user.role);

  return (
    <nav aria-label="Primary navigation" className="space-y-7">
      {navigationGroups.map((group) => {
        return (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#B5D2CE]/75">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.href} onNavigate={onNavigate} {...item} />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function AccountControl({ user }: { user: AppShellUser }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initials = getInitials(user.name, user.email);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-3.5 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B5D2CE]/85">
          Signed in
        </p>
        <span className="rounded-full bg-[#BDEFE5]/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#BDEFE5]">
          {user.role}
        </span>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 text-xs font-semibold text-[#F8FAFC]">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#F8FAFC]">
            {user.name}
          </p>
          <p className="truncate text-xs text-[#B5D2CE]">{user.email}</p>
        </div>
      </div>
      <Button
        className="mt-4 h-10 w-full rounded-xl border-white/15 bg-white/10 px-3 text-xs text-[#F8FAFC] transition hover:bg-white/15"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
        variant="secondary"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {isSigningOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  );
}

function HeaderAccountBadge({ user }: { user: AppShellUser }) {
  return (
    <div
      aria-label={`Signed in as ${user.name}`}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-white text-sm font-semibold text-slate-700"
      role="img"
    >
      {getInitials(user.name, user.email)}
    </div>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const menuPanel = menuPanelRef.current;

    if (!menuPanel) {
      return;
    }

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const getFocusableElements = () =>
      Array.from(
        menuPanel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );

    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentFocusableElements = getFocusableElements();
      const firstElement = currentFocusableElements[0];
      const lastElement =
        currentFocusableElements[currentFocusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (!menuPanel.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-hidden border-r border-[#0A4D4A] bg-[#063B3A] lg:flex lg:flex-col">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover opacity-30"
          fill
          priority
          sizes="288px"
          src="/images/sidebar-bg.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#063B3A]/95 via-[#063B3A]/90 to-[#031F1E]/95" />
        <div className="relative flex min-h-full flex-col px-5 py-6">
          <Brand />
          <div className="mt-9 border-t border-white/10 pt-6">
            <SidebarNav user={user} />
          </div>
          <div className="mt-auto pt-8">
            <AccountControl user={user} />
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <Button
                aria-controls="mobile-navigation"
                aria-expanded={mobileOpen}
                aria-label="Open navigation menu"
                className="size-10 px-0 lg:hidden"
                onClick={(event) => {
                  menuButtonRef.current = event.currentTarget;
                  setMobileOpen(true);
                }}
                variant="secondary"
              >
                <Menu aria-hidden="true" className="size-5" />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#102D2C]">
                  ResourceHub workspace
                </p>
                <p className="hidden text-xs text-[#475569] sm:block">
                  Secure access for resources and reservations
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3">
              <ResourceSearchForm className="hidden md:block" />
              <HeaderAccountBadge user={user} />
            </div>
          </div>
          <div className="px-4 pb-4 md:hidden">
            <ResourceSearchForm className="max-w-none" />
          </div>
        </header>

        {mobileOpen ? (
          <div
            aria-modal="true"
            className="fixed inset-0 z-40 lg:hidden"
            id="mobile-navigation"
            role="dialog"
          >
            <button
              aria-label="Close navigation menu"
              className="absolute inset-0 bg-slate-950/40"
              onClick={() => setMobileOpen(false)}
              tabIndex={-1}
              type="button"
            />
            <div
              className={cn(
                "relative flex h-full w-full max-w-80 flex-col overflow-hidden bg-[#063B3A] px-5 py-6 shadow-xl",
              )}
              ref={menuPanelRef}
            >
              <Image
                alt=""
                aria-hidden="true"
                className="object-cover opacity-30"
                fill
                sizes="320px"
                src="/images/sidebar-bg.png"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#063B3A]/95 via-[#063B3A]/90 to-[#031F1E]/95" />
              <div className="relative flex min-h-full flex-col">
                <div className="flex items-center justify-between gap-4">
                  <Brand />
                  <Button
                    aria-label="Close navigation menu"
                    className="size-10 px-0 text-[#F8FAFC] hover:bg-white/10 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                    variant="ghost"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </Button>
                </div>
                <div className="mt-8">
                  <SidebarNav
                    onNavigate={() => setMobileOpen(false)}
                    user={user}
                  />
                </div>
                <div className="mt-auto pt-8">
                  <AccountControl user={user} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
