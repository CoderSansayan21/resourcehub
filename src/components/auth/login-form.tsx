"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";
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
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Sign in
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use your ResourceHub member account to continue.
        </p>
      </div>

      {errors.form ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800"
          role="alert"
        >
          {errors.form}
        </div>
      ) : null}

      <TextField
        autoComplete="email"
        disabled={isPending}
        error={errors.email}
        inputMode="email"
        label="Email"
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
        disabled={isPending}
        error={errors.password}
        isVisible={showPassword}
        label="Password"
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

      <Button className="h-11 w-full" disabled={isPending} type="submit">
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <LogIn aria-hidden="true" className="size-4" />
        )}
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted">
        Need an account?{" "}
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href="/register"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
