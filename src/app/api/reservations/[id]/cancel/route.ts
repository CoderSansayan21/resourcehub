import { cancelReservation } from "@/lib/reservations";
import { reservationError, reservationJson } from "../../route-utils";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const reservation = await cancelReservation(id);

    return reservationJson({ reservation });
  } catch (error) {
    return reservationError(error);
  }
}
