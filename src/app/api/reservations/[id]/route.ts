import {
  getReservationDetails,
  updateReservation,
} from "@/lib/reservations";
import { readJsonBody, reservationError, reservationJson } from "../route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const reservation = await getReservationDetails(id);

    return reservationJson({ reservation });
  } catch (error) {
    return reservationError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const reservation = await updateReservation(id, body);

    return reservationJson({ reservation });
  } catch (error) {
    return reservationError(error);
  }
}
