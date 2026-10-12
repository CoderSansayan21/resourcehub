import { ResourceCatalog } from "@/components/resource-catalog";
import { PageHeading } from "@/components/ui/page-heading";
import { requireUser } from "@/lib/authorization";
import { listResourcesForCurrentUser } from "@/lib/resources";

export const instant = false;

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const [user, resources, params] = await Promise.all([
    requireUser(),
    listResourcesForCurrentUser(),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <PageHeading
        description="Browse real resources available in ResourceHub. Search by name, type, or location, then open a resource to review its details."
        eyebrow="Explore resources"
        title="Find the right space or equipment"
      />

      <ResourceCatalog
        initialQuery={params.q}
        initialType={params.type}
        resources={resources}
        userRole={user.role}
      />
    </div>
  );
}
