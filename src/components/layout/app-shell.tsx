"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavItem } from "@/components/layout/nav-item";
import { navigationGroups } from "@/components/layout/navigation";
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
      className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      href="/dashboard"
    >
      <span className="flex size-10 items-center justify-center rounded-md border border-white/15 bg-white/10 text-sm font-semibold text-[#F8FAFC] shadow-sm shadow-black/10">
        RH
      </span>
      <span>
        <span className="block font-heading text-base font-bold tracking-tight text-[#F8FAFC]">
          ResourceHub
        </span>
        <span className="block text-xs font-medium text-[#B5D2CE]">
          Resource operations
        </span>
      </span>
    </Link>
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
  return (
    <nav aria-label="Primary navigation" className="space-y-7">
      {navigationGroups.map((group) => {
        const items = group.items.filter(
          (item) => user.role === "ADMIN" || item.href !== "/admin",
        );

        if (items.length === 0) {
          return null;
        }

        return (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#B5D2CE]/75">
              {group.label}
            </p>
            <div className="space-y-1">
              {items.map((item) => (
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
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B5D2CE]/80">
        Signed in
      </p>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-[#F8FAFC]">
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
        className="mt-3 h-9 w-full border-white/15 bg-white/10 px-3 text-xs text-[#F8FAFC] hover:bg-white/15"
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#0A4D4A] bg-[#063B3A] px-5 py-6 lg:flex lg:flex-col">
        <Brand />
        <div className="mt-8 border-t border-white/10 pt-6">
          <SidebarNav user={user} />
        </div>
        <div className="mt-auto space-y-4 pt-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-[#F8FAFC]">Booking flow</p>
            <p className="mt-1 text-xs leading-5 text-[#B5D2CE]">
              Find a resource, inspect availability, select time, then reserve.
            </p>
          </div>
          <AccountControl user={user} />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
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
                <p className="truncate text-sm font-semibold text-slate-950">
                  ResourceHub workspace
                </p>
                <p className="hidden text-xs text-muted sm:block">
                  Signed in with database-backed access control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden h-9 w-64 items-center gap-2 rounded-md border border-border bg-slate-50 px-3 text-sm text-muted md:flex">
                <Search aria-hidden="true" className="size-4" />
                <span>Search resources soon</span>
              </div>
              <UserRound aria-hidden="true" className="hidden size-4 text-muted sm:block" />
              <HeaderAccountBadge user={user} />
            </div>
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
                "relative flex h-full w-full max-w-80 flex-col bg-[#063B3A] px-5 py-6 shadow-xl",
              )}
              ref={menuPanelRef}
            >
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
        ) : null}

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
