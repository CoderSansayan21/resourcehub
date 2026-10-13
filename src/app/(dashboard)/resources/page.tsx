import { ResourceCatalog } from "@/components/resource-catalog";
import { ResourcesHero } from "@/components/resources/resources-hero";
import { requireUser } from "@/lib/authorization";
import { listResourcesForCurrentUser } from "@/lib/resources";

export const instant = false;

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; type?: string }>;
}) {
  const [user, resources, params] = await Promise.all([
    requireUser(),
    listResourcesForCurrentUser(),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <ResourcesHero />

      <ResourceCatalog
        initialCategory={params.category}
        initialQuery={params.q}
        initialType={params.type}
        resources={resources}
        userRole={user.role}
      />
    </div>
  );
}
