"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ReservationsError({
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
      description="Reservations could not be loaded. Please retry, and if the issue continues an administrator can check the service logs."
      icon={AlertCircle}
      title="Reservations are unavailable"
    />
  );
}
