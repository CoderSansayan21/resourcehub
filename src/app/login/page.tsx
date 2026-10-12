import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";

export const instant = false;

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="Sign in to find resources, review availability, and keep your upcoming reservations close at hand."
      eyebrow="Secure access"
      footer="Only email and password sign-in is available for this workspace."
      title="Welcome back to ResourceHub."
    >
      <LoginForm />
    </AuthShell>
  );
}
