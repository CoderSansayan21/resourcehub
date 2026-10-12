import { AdminResourceManager } from "@/components/admin/admin-resource-manager";
import { PageHeading } from "@/components/ui/page-heading";
import { requireRole } from "@/lib/authorization";

export const instant = false;

export default async function AdminPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-8">
      <PageHeading
        description="Create, maintain, activate, and pause the physical resources members can reserve. Deactivation hides a resource from members while preserving its history."
        eyebrow="Administration"
        title="Resource management"
      />

      <AdminResourceManager />
    </div>
  );
}
