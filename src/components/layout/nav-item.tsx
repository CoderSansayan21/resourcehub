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
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BDEFE5]",
        isActive
          ? "bg-white text-[#063B3A] shadow-lg shadow-black/15"
          : "text-[#D8F1ED] hover:translate-x-0.5 hover:bg-white/[0.09] hover:text-white",
      )}
      href={href}
      onClick={onNavigate}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#087F73] opacity-0 transition-opacity",
          isActive && "opacity-100",
        )}
      />
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          isActive ? "bg-[#E8F7F3] text-[#087F73]" : "bg-white/10 text-[#BDEFE5]",
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span>{label}</span>
    </Link>
  );
}
