"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  icon: ComponentType<LucideProps>;
  label: string;
  onNavigate?: () => void;
};

export function NavItem({ href, icon: Icon, label, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        isActive
          ? "bg-[#087F73] text-[#F8FAFC] shadow-sm shadow-black/10"
          : "text-[#B5D2CE] hover:bg-white/[0.08] hover:text-[#F8FAFC]",
      )}
      href={href}
      onClick={onNavigate}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#F8FAFC] opacity-0 transition-opacity",
          isActive && "opacity-100",
        )}
      />
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
