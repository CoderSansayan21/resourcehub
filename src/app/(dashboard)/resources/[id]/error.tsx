"use client";

import { AlertCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ResourceDetailsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset} type="button">
            Try again
          </Button>
          <ButtonLink href="/resources" variant="secondary">
            Back to resources
          </ButtonLink>
        </div>
      }
      description="The resource details could not be loaded. Please retry or return to the catalog."
      icon={AlertCircle}
      title="Details are unavailable"
    />
  );
}
