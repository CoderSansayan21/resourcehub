import { AvailabilityOperationError } from "@/lib/availability";

export function availabilityJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function availabilityError(error: unknown) {
  if (error instanceof AvailabilityOperationError) {
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
        message: "Availability lookup failed.",
      },
    },
    { status: 500 },
  );
}
