import { CalendarClock, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";

export default function ReservationsPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        description="A management surface for upcoming, past, and cancelled reservations once booking functionality exists."
        eyebrow="My reservations"
        title="Track your workplace reservations"
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-950">
            Reservation list
          </h2>
          <p className="text-sm text-muted">
            This stage intentionally avoids booking actions and database reads.
          </p>
        </CardHeader>
        <EmptyState
          action={
            <ButtonLink href="/resources" variant="secondary">
              Start with resources
              <Plus aria-hidden="true" className="size-4" />
            </ButtonLink>
          }
          description="Confirmed and cancelled reservations will appear here after the reservation flow is implemented."
          icon={CalendarClock}
          title="No reservations to show yet"
        />
      </Card>
    </div>
  );
}
