import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  hint?: string;
};

export function Input({ className, hint, id, label, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={hintId}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 shadow-sm",
          "placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
          className,
        )}
        id={inputId}
        {...props}
      />
      {hint ? (
        <p className="text-xs leading-5 text-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
