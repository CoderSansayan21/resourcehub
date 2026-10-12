import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: keyof typeof badgeVariants;
};

export function Badge({ className, variant = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
