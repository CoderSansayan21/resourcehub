import {
  createReservation,
  listReservationsForCurrentUser,
} from "@/lib/reservations";
import { readJsonBody, reservationError, reservationJson } from "./route-utils";

export async function GET() {
  try {
    const reservations = await listReservationsForCurrentUser();
    return reservationJson({ reservations });
  } catch (error) {
    return reservationError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const reservation = await createReservation(body);

    return reservationJson({ reservation }, { status: 201 });
  } catch (error) {
    return reservationError(error);
  }
}
