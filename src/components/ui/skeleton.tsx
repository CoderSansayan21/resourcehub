import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}
