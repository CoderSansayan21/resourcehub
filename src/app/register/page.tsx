import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { RegisterShell } from "@/components/auth/register-shell";
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
    <RegisterShell>
      <RegisterForm />
    </RegisterShell>
  );
}
