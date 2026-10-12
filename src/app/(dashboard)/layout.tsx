import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/authorization";

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>;
}

async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return <AppShell user={user}>{children}</AppShell>;
}
