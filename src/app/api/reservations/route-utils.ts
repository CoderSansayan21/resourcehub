import { ReservationOperationError } from "@/lib/reservations";

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ReservationOperationError(400, "Request body must be valid JSON.");
  }
}

export function reservationJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function reservationError(error: unknown) {
  if (error instanceof ReservationOperationError) {
    return Response.json(
      {
        error: {
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return Response.json(
    {
      error: {
        message: "Reservation operation failed.",
      },
    },
    { status: 500 },
  );
}
