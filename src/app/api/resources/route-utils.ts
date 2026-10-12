import { ResourceOperationError } from "@/lib/resources";

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ResourceOperationError(400, "Request body must be valid JSON.");
  }
}

export function resourceJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function resourceError(error: unknown) {
  if (error instanceof ResourceOperationError) {
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
        message: "Resource operation failed.",
      },
    },
    { status: 500 },
  );
}
