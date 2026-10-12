"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ResourcesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      action={
        <Button onClick={reset} type="button">
          Try again
        </Button>
      }
      description="Resource data could not be loaded. Please retry, and if it keeps happening an administrator can check the service logs."
      icon={AlertCircle}
      title="Resources are unavailable"
    />
  );
}
