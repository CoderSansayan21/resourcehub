"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  getAuthErrorMessage,
  normalizeEmail,
  PasswordField,
  TextField,
} from "@/components/auth/auth-fields";

type LoginErrors = {
  email?: string;
  form?: string;
  password?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isPending, setIsPending] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    const nextErrors: LoginErrors = {};

    if (!normalizedEmail) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsPending(true);

    try {
      const result = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });

      if (result.error) {
        setErrors({
          form: getAuthErrorMessage(
            result,
            "We could not sign you in with those credentials.",
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
          "Something went wrong while signing you in.",
        ),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Secure sign in
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102D2C]">
          Welcome back
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in to your ResourceHub account.
        </p>
      </div>

      {errors.form ? (
        <div
          className="rounded-xl border border-red-200/70 bg-red-50/92 px-3 py-2 text-sm leading-6 text-red-800 shadow-sm"
          role="alert"
        >
          {errors.form}
        </div>
      ) : null}

      <TextField
        autoComplete="email"
        className="h-12 rounded-xl border-slate-300 bg-white text-[#102D2C] shadow-sm focus:bg-white"
        disabled={isPending}
        error={errors.email}
        inputMode="email"
        label="Email"
        labelClassName="text-[#102D2C] font-semibold"
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
        autoComplete="current-password"
        className="h-12 rounded-xl border-slate-300 bg-white text-[#102D2C] shadow-sm focus:bg-white"
        disabled={isPending}
        error={errors.password}
        isVisible={showPassword}
        label="Password"
        labelClassName="text-[#102D2C] font-semibold"
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

      <Button
        className="group h-12 w-full shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/24"
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
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        New to ResourceHub?{" "}
        <Link
          className="font-semibold text-primary underline-offset-4 transition hover:text-[#063B3A] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href="/register"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
