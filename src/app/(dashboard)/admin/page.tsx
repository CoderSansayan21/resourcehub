import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        description="A reserved surface for resource management, policies, and administrative review after access control is implemented."
        eyebrow="Administration"
        title="Prepare operational controls"
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-950">
              Admin modules
            </h2>
            <p className="text-sm text-muted">
              These modules are visual placeholders only.
            </p>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="slate">Resources</Badge>
            <Badge variant="slate">Policies</Badge>
            <Badge variant="slate">Users</Badge>
            <Badge variant="slate">Audit</Badge>
          </div>
        </Card>

        <EmptyState
          description="Admin functionality is intentionally not implemented in this stage. Authentication and permissions will define this area later."
          icon={ShieldCheck}
          title="Administration is waiting for access control"
        />
      </div>
    </div>
  );
}
