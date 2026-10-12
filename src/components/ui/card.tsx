import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-sm shadow-slate-200/70",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}
