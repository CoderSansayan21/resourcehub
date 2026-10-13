"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Lock, Mail, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  getAuthErrorMessage,
  normalizeEmail,
  PasswordField,
  TextField,
} from "@/components/auth/auth-fields";

type RegisterErrors = {
  confirmPassword?: string;
  email?: string;
  form?: string;
  name?: string;
  password?: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const nextErrors: RegisterErrors = {};

    if (!trimmedName) {
      nextErrors.name = "Enter your full name.";
    } else if (trimmedName.length < 2) {
      nextErrors.name = "Enter at least 2 characters.";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Create a password.";
    } else if (password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsPending(true);

    try {
      const result = await authClient.signUp.email({
        email: normalizedEmail,
        name: trimmedName,
        password,
      });

      if (result.error) {
        setErrors({
          form: getAuthErrorMessage(
            result,
            "We could not create your account right now.",
          ),
        });
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErrors({
        form: getAuthErrorMessage(
          error,
          "Something went wrong while creating your account.",
        ),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Get started
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#063B3A]">
          Create your account
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          A better way to book your workspace starts here.
        </p>
      </div>

      {errors.form ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800"
          role="alert"
        >
          {errors.form}
        </div>
      ) : null}

      <TextField
        autoComplete="name"
        className="h-12 rounded-xl border-slate-300 bg-white"
        disabled={isPending}
        error={errors.name}
        label="Full name"
        leadingIcon={<UserRound aria-hidden="true" className="size-4" />}
        name="name"
        onChange={(event) => {
          setName(event.target.value);
          setErrors((current) => ({ ...current, form: undefined, name: undefined }));
        }}
        placeholder="Alex Morgan"
        type="text"
        value={name}
      />

      <TextField
        autoComplete="email"
        className="h-12 rounded-xl border-slate-300 bg-white"
        disabled={isPending}
        error={errors.email}
        inputMode="email"
        label="Email"
        leadingIcon={<Mail aria-hidden="true" className="size-4" />}
        name="email"
        onChange={(event) => {
          setEmail(event.target.value);
          setErrors((current) => ({ ...current, email: undefined, form: undefined }));
        }}
        placeholder="you@company.com"
        type="email"
        value={email}
      />

      <PasswordField
        autoComplete="new-password"
        className="h-12 rounded-xl border-slate-300 bg-white"
        disabled={isPending}
        error={errors.password}
        isVisible={showPassword}
        label="Password"
        leadingIcon={<Lock aria-hidden="true" className="size-4" />}
        name="password"
        onChange={(event) => {
          setPassword(event.target.value);
          setErrors((current) => ({
            ...current,
            form: undefined,
            password: undefined,
          }));
        }}
        onToggleVisibility={() => setShowPassword((current) => !current)}
        value={password}
      />
      <p className="-mt-2 text-xs leading-5 text-slate-500">
        Use at least 8 characters. Choose a password that is hard to guess.
      </p>

      <PasswordField
        autoComplete="new-password"
        className="h-12 rounded-xl border-slate-300 bg-white"
        disabled={isPending}
        error={errors.confirmPassword}
        isVisible={showConfirmPassword}
        label="Confirm password"
        leadingIcon={<Lock aria-hidden="true" className="size-4" />}
        name="confirmPassword"
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          setErrors((current) => ({
            ...current,
            confirmPassword: undefined,
            form: undefined,
          }));
        }}
        onToggleVisibility={() =>
          setShowConfirmPassword((current) => !current)
        }
        value={confirmPassword}
      />

      <Button
        className="group mt-2 h-12 w-full shadow-lg shadow-teal-950/15 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-950/20"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        )}
        {isPending ? "Creating account..." : "Create member account"}
      </Button>

      <p className="pt-1 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-semibold text-primary underline-offset-4 transition hover:text-[#063B3A] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
