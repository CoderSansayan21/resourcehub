import { ReservationManager } from "@/components/reservation-manager";
import { PageHeading } from "@/components/ui/page-heading";
import { requireUser } from "@/lib/authorization";
import { listReservationsForCurrentUser } from "@/lib/reservations";

export const instant = false;

export default async function ReservationsPage() {
  const [user, reservations] = await Promise.all([
    requireUser(),
    listReservationsForCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeading
        description={
          user.role === "ADMIN"
            ? "Inspect every reservation across ResourceHub. Cross-user edits and cancellations remain disabled in this stage."
            : "Review upcoming bookings, update future reservations, and keep cancelled bookings in your history."
        }
        eyebrow={user.role === "ADMIN" ? "All reservations" : "My reservations"}
        title={
          user.role === "ADMIN"
            ? "Reservation operations"
            : "Track your workplace reservations"
        }
      />

      <ReservationManager
        currentUserId={user.id}
        reservations={reservations}
        userRole={user.role}
      />
    </div>
  );
}
