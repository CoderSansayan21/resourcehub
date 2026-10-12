import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/lib/auth";

export const instant = false;

export default async function RegisterPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="Create a member account to browse workplace resources and prepare reservations in a clean, focused dashboard."
      eyebrow="Member registration"
      footer="Already registered users are sent directly to the dashboard."
      title="Start booking shared resources."
    >
      <RegisterForm />
    </AuthShell>
  );
}
