"use client";

import { Eye, EyeOff } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type FieldProps = ComponentPropsWithoutRef<"input"> & {
  error?: string;
  label: string;
};

export function TextField({ className, error, id, label, ...props }: FieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800" htmlFor={fieldId}>
        {label}
      </label>
      <input
        aria-describedby={errorId}
        aria-invalid={error ? "true" : undefined}
        className={cn(
          "h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-900 shadow-sm",
          "placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
          error ? "border-red-400" : "border-border",
          className,
        )}
        id={fieldId}
        {...props}
      />
      {error ? (
        <p className="text-sm leading-5 text-red-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type PasswordFieldProps = FieldProps & {
  isVisible: boolean;
  onToggleVisibility: () => void;
};

export function PasswordField({
  className,
  error,
  id,
  isVisible,
  label,
  onToggleVisibility,
  ...props
}: PasswordFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");
  const errorId = error ? `${fieldId}-error` : undefined;
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800" htmlFor={fieldId}>
        {label}
      </label>
      <div className="relative">
        <input
          aria-describedby={errorId}
          aria-invalid={error ? "true" : undefined}
          className={cn(
            "h-11 w-full rounded-md border bg-white px-3 pr-11 text-sm text-slate-900 shadow-sm",
            "placeholder:text-slate-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary",
            "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
            error ? "border-red-400" : "border-border",
            className,
          )}
          id={fieldId}
          type={isVisible ? "text" : "password"}
          {...props}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="absolute inset-y-1 right-1 inline-flex w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50"
          disabled={props.disabled}
          onClick={onToggleVisibility}
          type="button"
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      </div>
      {error ? (
        <p className="text-sm leading-5 text-red-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if (
      "error" in error &&
      error.error &&
      typeof error.error === "object" &&
      "message" in error.error &&
      typeof error.error.message === "string"
    ) {
      return error.error.message;
    }
  }

  return fallback;
}
