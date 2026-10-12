import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function Forbidden() {
  return (
    <EmptyState
      action={
        <ButtonLink href="/dashboard" variant="secondary">
          Back to dashboard
        </ButtonLink>
      }
      description="Your account does not have permission to use ResourceHub administration."
      icon={ShieldAlert}
      title="Admin access required"
    />
  );
}
